import YouTube from "react-youtube";
import React, { useState, useEffect, useRef } from "react";

// import supabase from "./supabaseClient";
import calculateAggWatchedDuration from "./UpdateAggWatchedDuration";
import YouTubePlayer from "react-player/youtube";

const VideoPlayer: React.FC = () => {
	// for events where we need to store both start and end point of reference (relative location in video (#seconds played))
	interface DualDataPointWOTS {
		start: number;
		end: number;
	}

	// for events where we need to store both start and end point of reference (relative location in video (#seconds played)) and the event occurrence timestamp
	interface DualDataPoint {
		start: number;
		end: number;
		timestamp: number;
	}

	// for events where we need to store only a single point of reference (relative location in video (#seconds played)) and the event occurrence timestamp
	interface SingleDataPoint {
		location: number;
		timestamp: number;
	}
	// to store event data when users change payback rate of the video
	interface SingleDataPointPBR {
		location: number;
		timestamp: number;
		speed: number;
	}

	const [player, setPlayer] = useState<YouTubePlayer | null>(null);

	// implement - oof video location, tab switch video location
	const divRef = useRef<HTMLDivElement | null>(null);
	// a flag to show if video is playing or is paused or ended
	const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
	// a flag to show if video frame is out-of-focus (true)
	const [isOOF, setIsOOF] = useState<boolean>(false);
	// a flag to show if tab is switched to something else (true)
	const [isTS, setIsTS] = useState<boolean>(false);
	// a flag that is set to true when variables are updated
	const [updatedFlag, setUpdatedFlag] = useState<boolean>(false);
	// to register start and end timestamps for out-of-focus events
	const [endPointOOFDataPoints, setEndPointOOFDataPoints] = useState<
		SingleDataPoint[]
	>([]);
	const [startPointOOFDataPoints, setStartPointOOFDataPoints] = useState<
		SingleDataPoint[]
	>([]);
	// to register start and end timestamps for tab-switch events
	const [startPointTSDataPoints, setStartPointTSDataPoints] = useState<
		SingleDataPoint[]
	>([]);
	const [endPointTSDataPoints, setEndPointTSDataPoints] = useState<
		SingleDataPoint[]
	>([]);
	// for setting watched location timestamps
	const [startPoint, setStartPoint] = useState<number>(0);
	// to store present location in the video (in secs)
	const [watchDuration, setWatchDuration] = useState<number>(0);
	// to store last location in the video (in secs)
	// const [prevLocation, setPrevLocation] = useState<number>(null);
	// to store custom video events - skipped locations and event timestamp
	const [skippedDataPoints, setSkippedDataPoints] = useState<DualDataPoint[]>(
		[],
	);
	// to store custom video events - chunks of video watched
	const [watchedDataPoints, setWatchedDataPoints] = useState<
		DualDataPointWOTS[]
	>([]);
	// to store playbackrate modifications
	const [pbrDataPoints, setPBRDataPoints] = useState<SingleDataPointPBR[]>([
		{ location: 0, timestamp: Math.floor(Date.now() / 1000), speed: 1 },
	]);
	// to store pause events data
	const [pauseDataPoints, setPauseDataPoints] = useState<SingleDataPoint[]>([]);
	// aggregate watch duration of the video => total - skips
	const [aggWatchedDuration, setAggWatchedDuration] = useState(0);

	// capture timestamps when video goes out-of-focus or comes back in-focus
	useEffect(() => {
		const handleIntersection = (entries: IntersectionObserverEntry[]) => {
			entries.forEach(({ isIntersecting }) => {
				if (isIntersecting && isVideoPlaying) {
					setIsOOF(false);
				} else if (!isIntersecting && isVideoPlaying) {
					setIsOOF(true);
				}
			});
		};

		const observer = new IntersectionObserver(handleIntersection, {
			root: null,
			rootMargin: "0px",
			threshold: 1, // set according to % of screen visible for logging as not in focus - 0.75 means 25% or more of the screen should not be in frame to be invisible.
		});
		if (divRef.current) {
			observer.observe(divRef.current);
		}
		return () => {
			observer.disconnect();
		};
	});

	// capture timestamp when user navigates to a different tab and returns
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.hidden && isVideoPlaying) {
				setIsTS(true);
			} else if (!document.hidden && isVideoPlaying) {
				setIsTS(false);
			}
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	});

	// update data in supabase. we would want to modify this to when and how often we should be pushing data into supabase.
	// just formulating the datastructure that langdon suggested to store video events data.
	// useEffect(() => {
	//   const storeDataInSupabase = async () => {
	//     const { data, error } = await supabase.from("video_events").insert([
	//       {
	//         id: "id",
	//         video_id: "video_id",
	//         event_type: "event_type",
	//         user_id: "user_id",
	//         created_at: new Date(),
	//         data: {
	//           skips: skippedDataPoints,
	//           pauses: pauseDataPoints,
	//           playbackrates: pbrDataPoints,
	//           back_in_focus: endPointOOFDataPoints,
	//           went_out_of_focus: startPointOOFDataPoints,
	//           tab_switched_in: endPointTSDataPoints,
	//           tab_switched_out: startPointTSDataPoints,
	//           watched_chunks: watchedDataPoints,
	//         },
	//         watch_duration: aggWatchedDuration,
	//       },
	//     ]);

	//     if (error) {
	//       console.error("Error storing data in Supabase:", error);
	//     }
	//   };

	//   // need to modify: condition when to store data in supabase
	//   if (true) {
	//     storeDataInSupabase();
	//   }
	//   // need to modify: dependencies
	// }, [
	//   aggWatchedDuration,
	//   skippedDataPoints,
	//   pauseDataPoints,
	//   pbrDataPoints,
	//   endPointOOFDataPoints,
	//   startPointOOFDataPoints,
	//   endPointTSDataPoints,
	//   startPointTSDataPoints,
	//   watchedDataPoints,
	// ]);

	// function that updates location and timestamps for events when tab with the video frame is not actively dislayed on the screen
	const updateTabSwitch = (
		currentLocation: number,
		currentTimestamp: number,
	) => {
		if (isVideoPlaying) {
			// if else loop to control events that are registered - register end points only after start point has been registered and register only one end point corresponding to each start point.
			if (
				isTS &&
				startPointTSDataPoints.length === endPointTSDataPoints.length
			) {
				setStartPointTSDataPoints((prevDataPoints) => [
					...prevDataPoints,
					{ location: currentLocation, timestamp: currentTimestamp },
				]);
			} else if (
				!isTS &&
				startPointTSDataPoints.length - 1 === endPointTSDataPoints.length
			) {
				setEndPointTSDataPoints((prevDataPoints) => [
					...prevDataPoints,
					{ location: currentLocation, timestamp: currentTimestamp },
				]);
			}
		}
	};

	// function that updates location and timestamps for events when tab with the video frame is not actively dislayed on the screen
	const updateOutOfFocus = (
		currentLocation: number,
		currentTimestamp: number,
	) => {
		if (isVideoPlaying) {
			// if else loop to control events that are registered - register end points only after start point has been registered and register only one end point corresponding to each start point.
			if (
				isOOF &&
				startPointOOFDataPoints.length === endPointOOFDataPoints.length
			) {
				setStartPointOOFDataPoints((prevDataPoints) => [
					...prevDataPoints,
					{ location: currentLocation, timestamp: currentTimestamp },
				]);
			} else if (
				!isOOF &&
				startPointOOFDataPoints.length - 1 === endPointOOFDataPoints.length
			) {
				setEndPointOOFDataPoints((prevDataPoints) => [
					...prevDataPoints,
					{ location: currentLocation, timestamp: currentTimestamp },
				]);
			}
		}
	};

	// function to update skipped locations and timestamps. in addition, update the watched duration.
	const updateSkippedAndWatchedLocations = (
		currentLocation: number,
		currentTimestamp: number,
	) => {
		// adjusting skipped location logic w.r.t. playbackspeed. if not accounted for, then unusual skips are registered when playbackspeed != 1
		if (
			Math.abs(currentLocation - watchDuration) >
			1.1 * pbrDataPoints.slice(-1)[0].speed
		) {
			setSkippedDataPoints((prevDataPoints) => [
				...prevDataPoints,
				{
					start: watchDuration,
					end: currentLocation,
					timestamp: currentTimestamp,
				},
			]);

			setWatchedDataPoints((prevDataPoints) => [
				...prevDataPoints,
				{ start: startPoint, end: watchDuration },
			]);
			setStartPoint(currentLocation);
			setUpdatedFlag(true);
		}
	};

	// update watch duration and many other variables
	const handleProgress = (
		currentLocation: number,
		currentTimestamp: number,
	) => {
		// console.log("handleprogress - watchDuration", watchDuration);
		updateTabSwitch(currentLocation, currentTimestamp);
		updateOutOfFocus(currentLocation, currentTimestamp);
		updateSkippedAndWatchedLocations(currentLocation, currentTimestamp);
		setWatchDuration(currentLocation);

		// setPrevLocation((prev) => currentLocation);
		// console.log("handleprogress - PrevLocation", prevLocation);
		// console.log("handleprogress - currentLocation", currentLocation);
	};

	// update pause timestamps and locations
	const handlePlay = () => {
		// register pause events only if
		// 1. video has been played for more than a second
		// 2. present location pointer to the right of watched duration
		// 3. do not register as multiple pauses if within a second of previous pause

		const youtubePlayer: any = player;
		const currentLocation = youtubePlayer.getCurrentTime();
		const currentTimestamp = Math.floor(Date.now() / 1000);

		setIsVideoPlaying(true);
		if (
			currentLocation > 1 &&
			currentLocation > watchDuration &&
			currentLocation - watchDuration < 1 &&
			!isVideoPlaying
		) {
			if (skippedDataPoints.length > 0) {
				// this if else loop prevents registration of a pause within a second of a skip.
				// checking if length of skippedTimestamps > 0 to apply the logic.
				// if length = 0, then register a pause as there are no skips yet.
				if (currentLocation - skippedDataPoints.slice(-1)[0].end > 1) {
					setPauseDataPoints((prevDataPoints) => [
						...prevDataPoints,
						{ location: currentLocation, timestamp: currentTimestamp },
					]);
				}
			} else {
				setPauseDataPoints((prevDataPoints) => [
					...prevDataPoints,
					{ location: currentLocation, timestamp: currentTimestamp },
				]);
			}
		}
	};

	// update watched locations (chunks of seconds the user has watched) when video ends
	const handleEnd = () => {
		setIsVideoPlaying(false);
		setWatchedDataPoints((prevDataPoints) => [
			...prevDataPoints,
			{ start: startPoint, end: watchDuration },
		]);
		console.log("watchedDataPoints", watchedDataPoints);
		const aggWatchedDuration = calculateAggWatchedDuration(watchedDataPoints);
		console.log("aggWatchedDuration", aggWatchedDuration);
		setAggWatchedDuration(aggWatchedDuration);
	};

	// update locations and timestamps when playback speed is changed
	const handlePlaybackRateChange = (event) => {
		const youtubePlayer: any = event;
		setPBRDataPoints((prevDataPoints) => [
			...prevDataPoints,
			{
				location: watchDuration,
				timestamp: Math.floor(Date.now() / 1000),
				speed: youtubePlayer.target.getPlaybackRate(),
			},
		]);
	};

	useEffect(() => {
		if (player) {
			const intervalId = setInterval(() => {
				const currentLocation = player.getCurrentTime();
				const currentTimestamp = Math.floor(Date.now() / 1000);

				handleProgress(currentLocation, currentTimestamp);
			}, 1000);

			return () => {
				clearInterval(intervalId);
			};
		}
	}, [player]);

	return (
		<div>
			<div ref={divRef} className="flex justify-center">
				<YouTube
					videoId="d18ibbOWlXc"
					onPlay={() => handlePlay}
					onPause={() => setIsVideoPlaying(false)}
					onEnd={handleEnd}
					onReady={(event) => setPlayer(event.target)}
					onPlaybackRateChange={handlePlaybackRateChange}
				/>
			</div>
			<br />
			<div>
				<p className="text-xl">Current location: {watchDuration}</p>

				<p className="text-xl">Watch Duration: {aggWatchedDuration} seconds</p>
				<p>
					Note: Watch Duration will update only on skips or the end of the
					video. I did code it to update in real time but that induced a lot of
					lag!
				</p>
				<br />
				<hr />
				<br />
				<p className="text-2xl">
					Skipped Locations and Timestamps (in seconds):
				</p>
				<div className="flex justify-center">
					<ul className="p-1">
						{skippedDataPoints.map((dataPoint, index) => (
							<li key={index}>
								{index + 1}. From {dataPoint.start}s to {dataPoint.end}s at{" "}
								{dataPoint.timestamp}
							</li>
						))}
					</ul>
				</div>
				<br />
				<hr />
				<br />
				<p className="text-2xl">Modifications to Playback Speed:</p>
				<div className="flex justify-center">
					<ul className="p-1">
						{pbrDataPoints.map((dataPoint, index) => (
							<li key={index}>
								{index + 1}. Set to {dataPoint.speed}x at {dataPoint.location}s
								and {dataPoint.timestamp}
							</li>
						))}
					</ul>
				</div>
				<br />
				<hr />
				<br />
				<p className="text-2xl">Pause Locations and Timestamps:</p>
				<div className="flex justify-center">
					<ul className="p-1">
						{pauseDataPoints.map((dataPoint, index) => (
							<li key={index}>
								{index + 1}. {dataPoint.location}s at {dataPoint.timestamp}
							</li>
						))}
					</ul>
				</div>
				<br />
				<hr />
				<br />
				<p className="text-2xl">Out-Of-Focus Timestamps:</p>
				<div className="grid grid-cols-2 gap-4">
					<div className="p-4">
						<p>Went Out-Of-Focus:</p>
						<ul>
							{startPointOOFDataPoints.map((dataPoint, index) => (
								<li key={index}>
									{index + 1}. {dataPoint.location}s at {dataPoint.timestamp}
								</li>
							))}
						</ul>
					</div>
					<div className="p-4">
						<p>Returned In-Focus:</p>
						<ul>
							{endPointOOFDataPoints.map((dataPoint, index) => (
								<li key={index}>
									{index + 1}. {dataPoint.location}s at {dataPoint.timestamp}
								</li>
							))}
						</ul>
					</div>
				</div>
				<br />
				<hr />
				<br />
				<p className="text-2xl">Tab Switch Timestamps:</p>
				<div className="grid grid-cols-2 gap-4">
					<div className="p-4">
						<p>Moved Out:</p>
						<ul>
							{startPointTSDataPoints.map((dataPoint, index) => (
								<li key={index}>
									{index + 1}. {dataPoint.location}s at {dataPoint.timestamp}
								</li>
							))}
						</ul>
					</div>
					<div className="p-4">
						<p>Returned:</p>
						<ul>
							{endPointTSDataPoints.map((dataPoint, index) => (
								<li key={index}>
									{index + 1}. {dataPoint.location}s at {dataPoint.timestamp}
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
			<br />
		</div>
	);
};

export default VideoPlayer;

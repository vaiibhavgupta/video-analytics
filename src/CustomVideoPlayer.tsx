import ReactPlayer from "react-player";
import React, { useState, useEffect, useRef } from "react";
import calculateAggWatchedDuration from "./UpdateAggWatchedDuration";

// export default function VideoPlayer() {
const VideoPlayer: React.FC = () => {
  interface Progress {
    playedSeconds: number;
  }

  interface Location {
    start: number;
    end: number;
  }

  interface SpeedChange {
    location: number;
    speed: number;
  }

  interface SpeedTimestamp {
    timestamp: number;
    speed: number;
  }

  // interface PlayerInstance {
  //   getCurrentTime: () => number;
  // }

  // const divRef = useRef(null);
  const divRef = useRef<HTMLDivElement | null>(null);
  // const [endPointOOF, setEndPointOOF] = useState(0);
  const [endPointOOF, setEndPointOOF] = useState<number>(0);
  // const [startPointOOF, setStartPointOOF] = useState(0);
  const [startPointOOF, setStartPointOOF] = useState<number>(0);

  // const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  // const [startPointTabSwitch, setStartPointTabSwitch] = useState(0);
  const [startPointTabSwitch, setStartPointTabSwitch] = useState<number>(0);
  // const [endPointTabSwitch, setEndPointTabSwitch] = useState(0);
  const [endPointTabSwitch, setEndPointTabSwitch] = useState<number>(0);

  // const [watchDuration, setWatchDuration] = useState(0);
  const [watchDuration, setWatchDuration] = useState<number>(0);
  // const [updatedFlag, setUpdatedFlag] = useState(false);
  const [updatedFlag, setUpdatedFlag] = useState<boolean>(false);
  // const [startPoint, setStartPoint] = useState(0);
  const [startPoint, setStartPoint] = useState<number>(0);

  // const [skippedLocation, setSkippedLocation] = useState([]);
  const [skippedLocation, setSkippedLocation] = useState<Location[]>([]);
  // const [skippedTimestamp, setSkippedTimestamp] = useState([]);
  const [skippedTimestamp, setSkippedTimestamp] = useState<number[]>([]);
  // const [watchedLocation, setWatchedLocation] = useState([]);
  const [watchedLocation, setWatchedLocation] = useState<Location[]>([]);
  // const [outOfFocusTimeStamp, setOutOfFocusTimestamp] = useState([]);
  const [outOfFocusTimestamp, setOutOfFocusTimestamp] = useState<Location[]>([]);
  // const [tabSwitchTimeStamp, setTabSwitchTimestamp] = useState([]);
  const [tabSwitchTimestamp, setTabSwitchTimestamp] = useState<Location[]>([]);

  // const [speedChangeLocation, setSpeedChangeLocation] = useState([{ location: 0, speed: 1 }]);
  const [speedChangeLocation, setSpeedChangeLocation] = useState<SpeedChange[]>([{ location: 0, speed: 1 }]);

  // const [speedChangeTimestamp, setSpeedChangeTimestamp] = useState([{ timestamp: Math.floor(Date.now() / 1000), speed: 1 },]);
  const [speedChangeTimestamp, setSpeedChangeTimestamp] = useState<SpeedTimestamp[]>([
    { timestamp: Math.floor(Date.now() / 1000), speed: 1 },
  ]);

  const playerRef = useRef(null);
  // const playerRef = useRef<PlayerInstance>(null);

  // const [pauseLocation, setPauseLocation] = useState([]);
  const [pauseLocation, setPauseLocation] = useState<number[]>([]);

  // const [pauseTimestamp, setPauseTimestamp] = useState([]);
  const [pauseTimestamp, setPauseTimestamp] = useState<number[]>([]);

  const [aggWatchedDuration, setAggWatchedDuration] = useState(0);

  // capture timestamps when video goes out-of-focus or comes back in-focus
  useEffect(() => {
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(({ isIntersecting }) => {
        const currentTime = Math.floor(Date.now() / 1000);
        if (isIntersecting) {
          setEndPointOOF(currentTime);
        } else {
          setStartPointOOF(currentTime);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: "0px",
      threshold: 1,
    });

    if (divRef.current) {
      observer.observe(divRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // useEffect(() => {
  //   const observer = new IntersectionObserver(handleIntersection, {
  //     root: null,
  //     rootMargin: "0px",
  //     threshold: 1,
  //   });
  //   if (divRef.current) {
  //     observer.observe(divRef.current);
  //   }
  //   return () => {
  //     if (divRef.current) {
  //       observer.unobserve(divRef.current);
  //     }
  //   };
  // }, []);

  // const handleIntersection = (entries) => {
  //   entries.forEach((entry) => {
  //     if (entry.isIntersecting) {
  //       setEndPointOOF(Math.floor(Date.now() / 1000));
  //     } else {
  //       setStartPointOOF(Math.floor(Date.now() / 1000));
  //     }
  //   });
  // };

  // capture timestamp when user navigates to a different tab and returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isVideoPlaying) return;

      const currentTime = Math.floor(Date.now() / 1000);
      if (document.hidden) {
        setStartPointTabSwitch(currentTime);
      } else {
        setEndPointTabSwitch(currentTime);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  });

  // useEffect(() => {
  //   const handleVisibilityChange = () => {
  //     if (isVideoPlaying) {
  //       if (document.hidden) {
  //         // console.log("User switched tabs while video was playing!", Math.floor(Date.now() / 1000));
  //         setStartPointTabSwitch(Math.floor(Date.now() / 1000));
  //       } else {
  //         // console.log("tab in focus!", Math.floor(Date.now() / 1000));
  //         setEndPointTabSwitch(Math.floor(Date.now() / 1000));
  //       }
  //     }
  //   };
  //   // Add event listeners
  //   document.addEventListener("visibilitychange", handleVisibilityChange);
  //   // Cleanup the event listeners on unmount
  //   return () => {
  //     document.removeEventListener("visibilitychange", handleVisibilityChange);
  //   };
  // });

  // update watch duration and many other variables
  const handleProgress = (progress: Progress) => {
    const currentTime = progress.playedSeconds;
    updateSkippedAndWatchedLocations(currentTime);
    updateOutOfFocusTimestamps();
    updateTabSwitchTimestamps();
    setWatchDuration(currentTime);
  };

  const updateSkippedAndWatchedLocations = (currentTime: number) => {
    if (Math.abs(currentTime - watchDuration) > 1.1 * speedChangeLocation.slice(-1)[0].speed) {
      setSkippedLocation((prevLocations: Location[]) => [...prevLocations, { start: watchDuration, end: currentTime }]);
      setSkippedTimestamp((prevTimestamps: number[]) => [...prevTimestamps, Math.floor(Date.now() / 1000)]);

      setWatchedLocation((prevLocations: Location[]) => [...prevLocations, { start: startPoint, end: watchDuration }]);

      setStartPoint(currentTime);
      setUpdatedFlag(true);
    }
  };

  const updateOutOfFocusTimestamps = () => {
    if (endPointOOF > startPointOOF && startPointOOF > 0) {
      setOutOfFocusTimestamp((prevTimestamps: Location[]) => [
        ...prevTimestamps,
        { start: startPointOOF, end: endPointOOF },
      ]);
      setStartPointOOF(0);
    }
  };

  const updateTabSwitchTimestamps = () => {
    if (endPointTabSwitch > startPointTabSwitch && startPointTabSwitch > 0) {
      setTabSwitchTimestamp((prevTimestamps: Location[]) => [
        ...prevTimestamps,
        { start: startPointTabSwitch, end: endPointTabSwitch },
      ]);
      setStartPointTabSwitch(0);
    }
  };
  // const handleProgress = (progress) => {
  // const currentTime = progress.playedSeconds;
  // if (Math.abs(currentTime - watchDuration) > 1.1 * speedChangeLocation.slice(-1)[0].speed) {
  //   setSkippedLocation((prevLocations) => [...prevLocations, { start: watchDuration, end: currentTime }]);
  //   setSkippedTimestamp((prevTimestamps) => [...prevTimestamps, Math.floor(Date.now() / 1000)]);
  //   let allPriorWatchedLocations = watchedLocation;
  //   allPriorWatchedLocations.push({ start: startPoint, end: watchDuration });
  //   setWatchedLocation(allPriorWatchedLocations);
  //   setStartPoint(currentTime);
  //   setUpdatedFlag(true);
  // }
  // setWatchDuration(currentTime);
  // if (endPointOOF > startPointOOF && startPointOOF > 0) {
  //   setOutOfFocusTimestamp((prevTimestamps) => [...prevTimestamps, { start: startPointOOF, end: endPointOOF }]);
  //   setStartPointOOF(0);
  // }
  // if (endPointTabSwitch > startPointTabSwitch && startPointTabSwitch > 0) {
  //   setTabSwitchTimestamp((prevTimestamps) => [
  //     ...prevTimestamps,
  //     { start: startPointTabSwitch, end: endPointTabSwitch },
  //   ]);
  //   setStartPointTabSwitch(0);
  // }
  // };

  // update locations and timestamps when playback speed is changed
  const handlePlaybackRateChange = (newPlaybackRate: number) => {
    const newLocation: SpeedChange = {
      location: watchDuration,
      speed: newPlaybackRate,
    };

    const newTimestamp: SpeedTimestamp = {
      timestamp: Math.floor(Date.now() / 1000),
      speed: newPlaybackRate,
    };

    setSpeedChangeLocation((prevLocations) => [...prevLocations, newLocation]);
    setSpeedChangeTimestamp((prevTimestamps) => [...prevTimestamps, newTimestamp]);
  };

  // const handlePlaybackRateChange = (newPlaybackRate) => {
  //   setSpeedChangeLocation((prevLocations) => [...prevLocations, { location: watchDuration, speed: newPlaybackRate }]);
  //   setSpeedChangeTimestamp((prevTimestamps) => [
  //     ...prevTimestamps,
  //     { timestamp: Math.floor(Date.now() / 1000), speed: newPlaybackRate },
  //   ]);
  // };

  // update pause timestamps and locations
  const handlePlay = () => {
    const currentTime = playerRef.current.getCurrentTime();
    if (currentTime > 1 && currentTime > watchDuration && currentTime - watchDuration < 1) {
      if (skippedLocation.length > 0) {
        // this if else loop prevents registration of a pause within a second of a skip.
        // checking if length of skippedTimestamps > 0 to apply the logic.
        // if length = 0, then register a pause as there are no skips yet.
        if (currentTime - skippedLocation.slice(-1)[0].end > 1) {
          setPauseLocation((prevLocations) => [...prevLocations, currentTime]);
          setPauseTimestamp((prevTimestamps) => [...prevTimestamps, Math.floor(Date.now() / 1000)]);
        }
      } else {
        setPauseLocation((prevLocations) => [...prevLocations, currentTime]);
        setPauseTimestamp((prevTimestamps) => [...prevTimestamps, Math.floor(Date.now() / 1000)]);
      }
    }
  };

  const handleEnd = () => {
    setWatchedLocation((prevLocations: Location[]) => [...prevLocations, { start: startPoint, end: watchDuration }]);
    setUpdatedFlag(true);
  };

  if (updatedFlag) {
    setAggWatchedDuration(calculateAggWatchedDuration(watchedLocation));
    setUpdatedFlag(false);
  }

  // console.log("watchedLocation", watchedLocation);
  // console.log("aggWatchedDuration", aggWatchedDuration);
  return (
    <div>
      <div ref={divRef} className="flex justify-center">
        <ReactPlayer
          ref={playerRef}
          // url="https://www.youtube.com/watch?v=RpaxxN8jTHo"
          // url="https://www.youtube.com/watch?v=EiYm20F9WXU"
          url="https://www.youtube.com/watch?v=d18ibbOWlXc"
          controls
          onProgress={handleProgress}
          onPlaybackRateChange={handlePlaybackRateChange}
          onPlay={() => {
            setIsVideoPlaying(true);
            handlePlay();
          }}
          onPause={() => {
            setIsVideoPlaying(false);
          }}
          onEnded={() => {
            setIsVideoPlaying(false);
            handleEnd();
          }}
        />
      </div>
      <br />
      <div>
        <p className="text-xl">Watch Duration: {aggWatchedDuration.toFixed(2)} seconds</p>
        <p>
          Note: Watch Duration will update only on skips or the end of the video. I did code it to update in real time
          but that induced a lot of lag!
        </p>
        <br />
        <hr />
        <br />
        <p className="text-2xl">Skipped Locations and Timestamps (in seconds):</p>
        <div className="flex justify-center">
          <ul className="p-1">
            {skippedLocation.map((location, index) => (
              <li key={index}>
                {index + 1}. From {location.start.toFixed(2)} to {location.end.toFixed(2)}
              </li>
            ))}
          </ul>
          <ul className="p-1">
            {skippedTimestamp.map((timestamp, index) => (
              <li key={index}>at TS - {timestamp}</li>
            ))}
          </ul>
        </div>
        <br />
        <hr />
        <br />
        <p className="text-2xl">Modifications to Playback Speed:</p>
        <div className="flex justify-center">
          <ul className="p-1">
            {speedChangeLocation.map((location, index) => (
              <li key={index}>
                {index + 1}. Set at {location.speed}x at {location.location.toFixed(2)} seconds
              </li>
            ))}
          </ul>
          <ul className="p-1">
            {speedChangeTimestamp.map((timestamp, index) => (
              <li key={index}>at TS - {timestamp.timestamp}</li>
            ))}
          </ul>
        </div>
        <br />
        <hr />
        <br />
        <p className="text-2xl">Pause Locations and Timestamps:</p>
        <div className="flex justify-center">
          <ul className="p-1">
            {pauseLocation.map((location, index) => (
              <li key={index}>
                {index + 1}. {location.toFixed(2)} seconds
              </li>
            ))}
          </ul>
          <ul className="p-1">
            {pauseTimestamp.map((timestamp, index) => (
              <li key={index}>at TS - {timestamp}</li>
            ))}
          </ul>
        </div>
        <br />
        <hr />
        <br />
        <p className="text-2xl">Out-Of-Focus Timestamps:</p>
        <div>
          <ul>
            {outOfFocusTimestamp.map((timestamp, index) => (
              <li key={index}>
                {index + 1}. From {timestamp.start} to {timestamp.end}
              </li>
            ))}
          </ul>
        </div>
        <br />
        <hr />
        <br />
        <p className="text-2xl">Tab Switch Timestamps:</p>
        <div>
          <ul>
            {tabSwitchTimestamp.map((timestamp, index) => (
              <li key={index}>
                {index + 1}. Out-Of-Focus at {timestamp.start} | In-Focus at {timestamp.end}
              </li>
            ))}
          </ul>
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

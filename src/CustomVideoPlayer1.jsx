import React, { useState, useEffect, useRef } from "react";
import ReactPlayer from "react-player";
import calculateAggWatchedDuration from "./UpdateAggWatchedDuration";

export default function VideoPlayer() {
  const divRef = useRef(null);

  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const playerRef = useRef(null);
  const [updatedFlag, setUpdatedFlag] = useState(false);
  const [watchDuration, setWatchDuration] = useState(0);
  const [aggWatchedDuration, setAggWatchedDuration] = useState(0);

  const [pauseLocation, setPauseLocation] = useState([]);
  const [pauseTimestamp, setPauseTimestamp] = useState([]);

  const [startPoint, setStartPoint] = useState(0);
  const [watchedLocation, setWatchedLocation] = useState([]);
  const [skippedLocation, setSkippedLocation] = useState([]);
  const [skippedTimestamp, setSkippedTimestamp] = useState([]);

  const [speedChangeLocation, setSpeedChangeLocation] = useState([{ location: 0, speed: 1 }]);
  const [speedChangeTimestamp, setSpeedChangeTimestamp] = useState([
    { timestamp: Math.floor(Date.now() / 1000), speed: 1 },
  ]);

  const [endPointOOF, setEndPointOOF] = useState(0);
  const [startPointOOF, setStartPointOOF] = useState(0);
  const [outOfFocusTimeStamp, setOutOfFocusTimestamp] = useState([]);

  const [startPointTabSwitch, setStartPointTabSwitch] = useState([]);
  const [endPointTabSwitch, setEndPointTabSwitch] = useState([]);
  const [tabSwitchTimeStamp, setTabSwitchTimestamp] = useState([]);

  // play video if visible in view port
  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: "0px",
      threshold: 1, // Fully visible in the viewport
    });

    if (divRef.current) {
      observer.observe(divRef.current);
    }

    return () => {
      if (divRef.current) {
        observer.unobserve(divRef.current);
      }
    };
  }, []);

  const handleIntersection = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setEndPointOOF(Math.floor(Date.now() / 1000));
      } else {
        setStartPointOOF(Math.floor(Date.now() / 1000));
      }
    });
  };

  useEffect(() => {
    // Function to handle visibility change
    const handleVisibilityChange = () => {
      if (isVideoPlaying) {
        if (document.hidden) {
          // console.log("User switched tabs while video was playing!", Math.floor(Date.now() / 1000));
          setStartPointTabSwitch(Math.floor(Date.now() / 1000));
        } else {
          // console.log("tab in focus!", Math.floor(Date.now() / 1000));
          setEndPointTabSwitch(Math.floor(Date.now() / 1000));
        }
      }
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup the event listeners on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  });

  // update watch duration
  const handleProgress = (progress) => {
    const currentTime = progress.playedSeconds;

    if (Math.abs(currentTime - watchDuration) > 1.1 * speedChangeLocation.slice(-1)[0].speed) {
      setSkippedLocation((prevLocations) => [...prevLocations, { start: watchDuration, end: currentTime }]);
      setSkippedTimestamp((prevTimestamps) => [...prevTimestamps, Math.floor(Date.now() / 1000)]);

      let allPriorWatchedLocations = watchedLocation;
      allPriorWatchedLocations.push({ start: startPoint, end: watchDuration });
      setWatchedLocation(allPriorWatchedLocations);
      setStartPoint(currentTime);
      setUpdatedFlag(true);
    }

    setWatchDuration(currentTime);

    if (endPointOOF > startPointOOF && startPointOOF > 0) {
      setOutOfFocusTimestamp((prevTimestamps) => [...prevTimestamps, { start: startPointOOF, end: endPointOOF }]);
      setStartPointOOF(0);
    }

    if (endPointTabSwitch > startPointTabSwitch && startPointTabSwitch > 0) {
      setTabSwitchTimestamp((prevTimestamps) => [
        ...prevTimestamps,
        { start: startPointTabSwitch, end: endPointTabSwitch },
      ]);
      setStartPointTabSwitch(0);
    }
  };

  // update timestamps when playback speed is changed
  const handlePlaybackRateChange = (newPlaybackRate) => {
    setSpeedChangeLocation((prevLocations) => [...prevLocations, { location: watchDuration, speed: newPlaybackRate }]);
    setSpeedChangeTimestamp((prevTimestamps) => [
      ...prevTimestamps,
      { timestamp: Math.floor(Date.now() / 1000), speed: newPlaybackRate },
    ]);
  };

  // update pause timestamps
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
    let allPriorWatchedLocations = watchedLocation;
    allPriorWatchedLocations.push({ start: startPoint, end: watchDuration });
    setWatchedLocation(allPriorWatchedLocations);
    setUpdatedFlag(true);
  };

  if (updatedFlag) {
    setAggWatchedDuration(calculateAggWatchedDuration(watchedLocation));
    setUpdatedFlag(false);
    setIsVideoPlaying(false);
  }

  // console.log("watchedLocation", watchedLocation);
  // console.log("aggWatchedDuration", aggWatchedDuration);

  return (
    <div>
      <div ref={divRef} className="flex justify-center">
        <ReactPlayer
          ref={playerRef}
          // url="https://www.youtube.com/watch?v=RpaxxN8jTHo"
          url="https://www.youtube.com/watch?v=EiYm20F9WXU"
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
        <p class="text-xl">Watch Duration: {aggWatchedDuration.toFixed(2)} seconds</p>
        <p>
          Note: Watch Duration will update only on skips or the end of the video. I did code it to update in real time
          but that induced a lot of lag!
        </p>
        <br />
        <hr />
        <br />
        <p class="text-2xl">Skipped Locations and Timestamps (in seconds):</p>
        <div class="flex justify-center">
          <ul class="p-1">
            {skippedLocation.map((location, index) => (
              <li key={index}>
                {index + 1}. From {location.start.toFixed(2)} to {location.end.toFixed(2)}
              </li>
            ))}
          </ul>
          <ul class="p-1">
            {skippedTimestamp.map((timestamp, index) => (
              <li key={index}>at TS - {timestamp}</li>
            ))}
          </ul>
        </div>
        <br />
        <hr />
        <br />
        <p class="text-2xl">Modifications to Playback Speed:</p>
        <div class="flex justify-center">
          <ul class="p-1">
            {speedChangeLocation.map((location, index) => (
              <li key={index}>
                {index + 1}. Set at {location.speed}x at {parseFloat(location.location).toFixed(2)} seconds
              </li>
            ))}
          </ul>
          <ul class="p-1">
            {speedChangeTimestamp.map((timestamp, index) => (
              <li key={index}>at TS - {timestamp.timestamp}</li>
            ))}
          </ul>
        </div>
        <br />
        <hr />
        <br />
        <p class="text-2xl">Pause Locations and Timestamps:</p>
        <div class="flex justify-center">
          <ul class="p-1">
            {pauseLocation.map((location, index) => (
              <li key={index}>
                {index + 1}. {location.toFixed(2)} seconds
              </li>
            ))}
          </ul>
          <ul class="p-1">
            {pauseTimestamp.map((timestamp, index) => (
              <li key={index}>at TS - {timestamp}</li>
            ))}
          </ul>
        </div>
        <br />
        <hr />
        <br />
        <p class="text-2xl">Out-Of-Focus Timestamps:</p>
        <div>
          <ul>
            {outOfFocusTimeStamp.map((timestamp, index) => (
              <li key={index}>
                {index + 1}. From {timestamp.start} to {timestamp.end}
              </li>
            ))}
          </ul>
        </div>
        <br />
        <hr />
        <br />
        <p class="text-2xl">Tab Switch Timestamps:</p>
        <div>
          <ul>
            {tabSwitchTimeStamp.map((timestamp, index) => (
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
}

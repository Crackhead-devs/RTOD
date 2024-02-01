import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";
import Webcam from "react-webcam";

import { drawRect } from "./utilities";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [detectedObjects, setDetectedObjects] = useState([]);


  // Function to get all video input devices
  const getVideoInputDevices = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    setDevices(videoDevices);
  };

  // Main function
  const runCoco = async () => {
    const net = await cocossd.load();
    console.log("COCO-SSD model loaded.");
    //  Loop and detect objects
    setInterval(() => {
      detect(net);
    }, 10);
  };

  const detect = async (net) => {
    // Check data is available
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width and height
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Set canvas height and width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Make Detections
      const objs = await net.detect(video);
      setDetectedObjects(objs); // Store the detected objects in the state

      // Draw detections
      const ctx = canvasRef.current.getContext("2d");
      drawRect(objs, ctx);
    }
  };

  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    // Download the image
    downloadImage(imageSrc);
    // Log detected objects and their locations
    console.log("Detected objects:", detectedObjects);
    detectedObjects.forEach(obj => {
      console.log(`Label: ${obj.class}, Score: ${obj.score}, Location: `, obj.bbox);
    });
  }, [webcamRef, detectedObjects]);

  const downloadImage = (imageSrc) => {
    const downloadLink = document.createElement('a');
    downloadLink.href = imageSrc;
    downloadLink.download = 'captured.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  useEffect(() => {
    getVideoInputDevices();
    runCoco();
  }, []);

  return (
    <div className="App" style={{ width: '100%', height: '100%' }}>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/png"
        videoConstraints={{
          facingMode: "environment" // changed to 'user' to see if it works; change back to 'environment' if needed
        }}
        style={{
          position: "absolute",
         
        }}
      />

      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
         
          
        }}
      />

      <button onClick={capture} style={{
          position: "fixed",
          bottom: 20,
          zIndex: 20,
          left: "50%",
          transform: "translateX(-50%)"
        }}>
        Capture photo
      </button>
    </div>
  );
}

export default App;

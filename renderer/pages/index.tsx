import { useState, useEffect, useRef, useCallback } from "react";
import commands from "../../electron/commands";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProgressBar from "../components/ProgressBar";
import ResetButton from "../components/ResetButton";
import LeftPaneSteps from "../components/LeftPaneImageSteps";
import RightPaneInfo from "../components/RightPaneInfo";
import ImageOptions from "../components/ImageOptions";
import LeftPaneVideoSteps from "../components/LeftPaneVideoSteps";
import LeftPaneImageSteps from "../components/LeftPaneImageSteps";

const Home = () => {
  const [imagePath, SetImagePath] = useState("");
  const [upscaledImagePath, setUpscaledImagePath] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [scaleFactor, setScaleFactor] = useState(4);
  const [progress, setProgress] = useState("");
  const [model, setModel] = useState("remacri");
  const [loaded, setLoaded] = useState(false);
  const [version, setVersion] = useState("");
  const [batchMode, setBatchMode] = useState(false);
  const [batchFolderPath, setBatchFolderPath] = useState("");
  const [upscaledBatchFolderPath, setUpscaledBatchFolderPath] = useState("");
  const [doubleUpscayl, setDoubleUpscayl] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [videoPath, setVideoPath] = useState("");
  const [upscaledVideoPath, setUpscaledVideoPath] = useState("");
  const [doubleUpscaylCounter, setDoubleUpscaylCounter] = useState(0);

  const resetImagePaths = () => {
    setProgress("");

    SetImagePath("");
    setUpscaledImagePath("");

    setBatchFolderPath("");
    setUpscaledBatchFolderPath("");

    setVideoPath("");
    setUpscaledVideoPath("");
  };

  useEffect(() => {
    setLoaded(true);

    setVersion(navigator?.userAgent?.match(/Upscayl\/([\d\.]+\d+)/)[1]);

    const handleErrors = (data) => {
      if (data.includes("invalid gpu")) {
        alert(
          "Error. Please make sure you have a Vulkan compatible GPU (Most modern GPUs support Vulkan). Upscayl does not work with CPU or iGPU sadly."
        );
        resetImagePaths();
      } else if (data.includes("failed")) {
        if (batchMode) return;
        alert(
          data.includes("encode")
            ? "ENCODING ERROR => "
            : "DECODING ERROR => " +
                "This image is possibly corrupt or not supported by Upscayl. You could try converting the image into another format and upscaling again. Otherwise, make sure that the output path is correct and you have the proper write permissions for the directory. If not, then unfortuantely this image is not supported by Upscayl, sorry."
        );
        resetImagePaths();
      } else if (data.includes("uncaughtException")) {
        alert(
          "Upscayl encountered an error. Possibly, the upscayl binary failed to execute the commands properly. Try launching Upscayl using commandline through Terminal and see if you get any information. You can post an issue on Upscayl's GitHub repository for more help."
        );
        resetImagePaths();
      }
    };

    window.electron.on(commands.UPSCAYL_PROGRESS, (_, data) => {
      console.log(
        "🚀 => file: index.jsx => line 61 => window.electron.on => data",
        data
      );

      if (data.length > 0 && data.length < 10) {
        setProgress(data);
      }
      handleErrors(data);
    });
    window.electron.on(commands.FOLDER_UPSCAYL_PROGRESS, (_, data) => {
      if (data.length > 0 && data.length < 10) {
        setProgress(data);
      }
      handleErrors(data);
    });
    window.electron.on(commands.DOUBLE_UPSCAYL_PROGRESS, (_, data) => {
      if (data.length > 0 && data.length < 10) {
        if (data === "0.00%") {
          setDoubleUpscaylCounter(doubleUpscaylCounter + 1);
        }
        setProgress(data);
      }
      handleErrors(data);
    });
    window.electron.on(commands.UPSCAYL_VIDEO_PROGRESS, (_, data) => {
      if (data.length > 0 && data.length < 10) {
        setProgress(data);
      }
      handleErrors(data);
    });

    window.electron.on(commands.UPSCAYL_DONE, (_, data) => {
      setProgress("");
      setUpscaledImagePath(data);
    });
    window.electron.on(commands.FOLDER_UPSCAYL_DONE, (_, data) => {
      setProgress("");
      setUpscaledBatchFolderPath(data);
    });
    window.electron.on(commands.DOUBLE_UPSCAYL_DONE, (_, data) => {
      setProgress("");
      setDoubleUpscaylCounter(0);
      setUpscaledImagePath(data);
    });
    window.electron.on(commands.UPSCAYL_VIDEO_DONE, (_, data) => {
      setProgress("");
      setUpscaledVideoPath(data);
    });
  }, []);

  useEffect(() => {
    setProgress("");
  }, [batchMode]);

  useEffect(() => {
    if (imagePath.length > 0 && !isVideo) {
      const filePath = imagePath;
      console.log(
        "🚀 => file: index.jsx => line 109 => useEffect => filePath",
        filePath
      );

      const extension = imagePath.toLocaleLowerCase().split(".").pop();
      console.log(
        "🚀 => file: index.jsx => line 111 => useEffect => extension",
        extension
      );

      if (!allowedFileTypes.includes(extension.toLowerCase())) {
        alert("Please select an image");
        resetImagePaths();
      }
    } else if (videoPath.length > 0 && isVideo) {
      const filePath = videoPath;

      console.log("🚀 => file: index.tsx => line 146 => filePath", filePath);

      const extension = videoPath.toLocaleLowerCase().split(".").pop();

      console.log("🚀 => file: index.tsx => line 150 => extension", extension);

      if (!allowedVideoFileTypes.includes(extension.toLowerCase())) {
        alert("Please select an MP4, WebM or MKV video");
        resetImagePaths();
      }
    } else {
      resetImagePaths();
    }
  }, [imagePath, videoPath]);

  const selectVideoHandler = async () => {
    resetImagePaths();

    var path = await window.electron.invoke(commands.SELECT_FILE);

    if (path !== "cancelled") {
      setVideoPath(path);
      var dirname = path.match(/(.*)[\/\\]/)[1] || "";
      setOutputPath(dirname);
    }
  };

  const selectImageHandler = async () => {
    resetImagePaths();

    var path = await window.electron.invoke(commands.SELECT_FILE);

    if (path !== "cancelled") {
      SetImagePath(path);
      var dirname = path.match(/(.*)[\/\\]/)[1] || "";
      setOutputPath(dirname);
    }
  };

  const selectFolderHandler = async () => {
    resetImagePaths();

    var path = await window.electron.invoke(commands.SELECT_FOLDER);

    if (path !== "cancelled") {
      setBatchFolderPath(path);
      setOutputPath(path + "_upscayled");
    }
  };

  const handleModelChange = (e) => {
    setModel(e.value);
    if (e.value === "models-DF2K") {
      setDoubleUpscayl(false);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    console.log("drag enter");
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    console.log("drag leave");
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    console.log("drag over");
  };
  const openFolderHandler = (e) => {
    window.electron.send(commands.OPEN_FOLDER, upscaledBatchFolderPath);
  };

  const allowedFileTypes = ["png", "jpg", "jpeg", "webp"];
  const allowedVideoFileTypes = ["webm", "mp4", "mkv"];

  const handleDrop = (e) => {
    e.preventDefault();
    resetImagePaths();

    const type = e.dataTransfer.items[0].type;
    console.log("🚀 => handleDrop => type", type);
    const filePath = e.dataTransfer.files[0].path;
    console.log("🚀 => handleDrop => filePath", filePath);
    const extension = e.dataTransfer.files[0].name.split(".").at(-1);
    console.log("🚀 => handleDrop => extension", extension);

    if (
      (!type.includes("image") && !type.includes("video")) ||
      (!allowedFileTypes.includes(extension.toLowerCase()) &&
        !allowedVideoFileTypes.includes(extension.toLowerCase()))
    ) {
      alert("Please drag and drop an image");
    } else {
      if (isVideo) {
        setVideoPath(filePath);
      } else {
        SetImagePath(filePath);
      }

      var dirname = filePath.match(/(.*)[\/\\]/)[1] || "";
      console.log("🚀 => handleDrop => dirname", dirname);
      setOutputPath(dirname);
    }
  };

  const handlePaste = (e) => {
    console.log(e);
    resetImagePaths();
    e.preventDefault();
    const type = e.clipboardData.items[0].type;
    const filePath = e.clipboardData.files[0].path;
    const extension = e.clipboardData.files[0].name.split(".").at(-1);

    if (
      !type.includes("image") &&
      !allowedFileTypes.includes(extension.toLowerCase())
    ) {
      alert("Please drag and drop an image");
    } else {
      SetImagePath(filePath);
      var dirname = filePath.match(/(.*)[\/\\]/)[1] || "";
      setOutputPath(dirname);
    }
  };

  const outputHandler = async () => {
    var path = await window.electron.invoke(commands.SELECT_FOLDER);
    if (path !== "cancelled") {
      setOutputPath(path);
    } else {
      console.log("Getting output path from input file");
    }
  };

  const upscaylHandler = async () => {
    if (isVideo) {
      setUpscaledVideoPath("");
    } else {
      setUpscaledImagePath("");
    }
    if (!isVideo && (imagePath !== "" || batchFolderPath !== "")) {
      setProgress("Hold on...");
      if (model === "models-DF2K") {
        setDoubleUpscayl(false);
      }

      if (doubleUpscayl) {
        await window.electron.send(commands.DOUBLE_UPSCAYL, {
          imagePath,
          outputPath,
          model,
        });
      } else if (batchMode) {
        setDoubleUpscayl(false);
        await window.electron.send(commands.FOLDER_UPSCAYL, {
          scaleFactor,
          batchFolderPath,
          outputPath,
          model,
        });
      } else {
        await window.electron.send(commands.UPSCAYL, {
          scaleFactor,
          imagePath,
          outputPath,
          model,
        });
      }
    } else if (isVideo && videoPath !== "") {
      await window.electron.send(commands.UPSCAYL_VIDEO, {
        scaleFactor,
        videoPath,
        outputPath,
        model,
      });
    } else {
      alert(`Please select ${isVideo ? "a video" : "an image"} to upscale`);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-row overflow-hidden bg-base-300">
      <div className="flex h-screen w-128 flex-col rounded-r-3xl bg-base-100">
        {((!batchMode && imagePath.length > 0) ||
          (batchMode && batchFolderPath.length > 0)) && (
          <ResetButton resetImagePaths={resetImagePaths} />
        )}
        {/* HEADER */}
        <Header />
        {/* <div className="flex items-center justify-center gap-2 pb-4 font-medium">
          <p>Image</p>
          <input
            type="radio"
            name="radio-1"
            className="radio"
            checked={!isVideo}
            onChange={() => {
              setIsVideo(false);
              console.log("isImage");
            }}
          />
          <input
            type="radio"
            name="radio-1"
            className="radio"
            checked={isVideo}
            onChange={() => {
              setIsVideo(true);
              console.log("isVideo");
            }}
          />
          <p>Video</p>
        </div> */}
        {/* LEFT PANE */}
        {isVideo ? (
          <LeftPaneVideoSteps
            progress={progress}
            selectVideoHandler={selectVideoHandler}
            handleModelChange={handleModelChange}
            handleDrop={handleDrop}
            outputHandler={outputHandler}
            upscaylHandler={upscaylHandler}
            outputPath={outputPath}
            videoPath={videoPath}
            model={model}
            isVideo={isVideo}
            setIsVideo={setIsVideo}
          />
        ) : (
          <LeftPaneImageSteps
            progress={progress}
            selectImageHandler={selectImageHandler}
            selectFolderHandler={selectFolderHandler}
            handleModelChange={handleModelChange}
            handleDrop={handleDrop}
            outputHandler={outputHandler}
            upscaylHandler={upscaylHandler}
            batchMode={batchMode}
            setBatchMode={setBatchMode}
            imagePath={imagePath}
            outputPath={outputPath}
            doubleUpscayl={doubleUpscayl}
            setDoubleUpscayl={setDoubleUpscayl}
            model={model}
            isVideo={isVideo}
            setIsVideo={setIsVideo}
          />
        )}
        <Footer />
      </div>

      {/* RIGHT PANE */}
      <div
        className="relative flex h-screen w-full flex-col items-center justify-center"
        onDrop={(e) => handleDrop(e)}
        onDragOver={(e) => handleDragOver(e)}
        onDragEnter={(e) => handleDragEnter(e)}
        onDragLeave={(e) => handleDragLeave(e)}
        onPaste={(e) => handlePaste(e)}>
        {progress.length > 0 &&
        upscaledImagePath.length === 0 &&
        upscaledBatchFolderPath.length === 0 &&
        upscaledVideoPath.length === 0 ? (
          <ProgressBar
            progress={progress}
            doubleUpscaylCounter={doubleUpscaylCounter}
          />
        ) : null}

        {/* DEFAULT PANE INFO */}
        {((!isVideo &&
          !batchMode &&
          imagePath.length === 0 &&
          upscaledImagePath.length === 0) ||
          (!isVideo &&
            batchMode &&
            batchFolderPath.length === 0 &&
            upscaledBatchFolderPath.length === 0) ||
          (isVideo &&
            videoPath.length === 0 &&
            upscaledVideoPath.length === 0)) && (
          <RightPaneInfo
            version={version}
            batchMode={batchMode}
            isVideo={isVideo}
          />
        )}

        {/* SHOW SELECTED IMAGE */}
        {!batchMode &&
          !isVideo &&
          upscaledImagePath.length === 0 &&
          imagePath.length > 0 && (
            <img
              className="h-full w-full object-contain"
              src={
                "file://" +
                `${upscaledImagePath ? upscaledImagePath : imagePath}`
              }
              draggable="false"
              alt=""
            />
          )}

        {/* BATCH UPSCALE SHOW SELECTED FOLDER */}
        {batchMode &&
          upscaledBatchFolderPath.length === 0 &&
          batchFolderPath.length > 0 && (
            <p className="text-neutral-50 select-none font-bold">
              Selected folder: {batchFolderPath}
            </p>
          )}

        {/* BATCH UPSCALE DONE INFO */}
        {batchMode && upscaledBatchFolderPath.length > 0 && (
          <>
            <p className="text-neutral-50 select-none py-4 font-bold">
              All done!
            </p>
            <button
              className="bg-gradient-blue rounded-lg p-3 font-medium text-white/90 transition-colors"
              onClick={openFolderHandler}>
              Open Upscayled Folder
            </button>
          </>
        )}

        {/* COMPARISON SLIDER */}
        {!batchMode &&
          !isVideo &&
          imagePath.length > 0 &&
          upscaledImagePath.length > 0 && (
            <>
              <ImageOptions />
              <ReactCompareSlider
                itemOne={
                  <>
                    <p className="absolute bottom-1 left-1 rounded-md bg-black p-1 text-sm font-medium text-white opacity-30">
                      Original
                    </p>
                    <ReactCompareSliderImage
                      src={"file://" + imagePath}
                      alt="Original"
                      style={{
                        objectFit: "contain",
                      }}
                      className="bg-[#1d1c23]"
                    />
                  </>
                }
                itemTwo={
                  <>
                    <p className="absolute bottom-1 right-1 rounded-md bg-black p-1 text-sm font-medium text-white opacity-30">
                      Upscayled
                    </p>
                    <ReactCompareSliderImage
                      src={"file://" + upscaledImagePath}
                      alt="Upscayl"
                      style={{
                        objectFit: "contain",
                      }}
                      className="bg-[#1d1c23]"
                    />
                  </>
                }
                className="h-screen"
              />
            </>
          )}

        {isVideo && videoPath.length > 0 && upscaledVideoPath.length === 0 && (
          <video autoPlay controls className="m-10 w-11/12 rounded-2xl">
            <source src={"file://" + videoPath} type="video/mp4" />
          </video>
        )}
      </div>
    </div>
  );
};

export default Home;

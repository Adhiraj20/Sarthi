import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { apiConnector } from "../services/apiConnector";

export default function LiveClass() {
  const { roomId } = useParams();
  const meetingRef = useRef(null);
  const zpRef = useRef(null); // store instance
  useEffect(() => {
  return () => {
    // when instructor leaves
    endClass();
  };
}, []);
const endClass = async () => {
  try {
    await apiConnector(
      "POST",
      "/live-class/end",
      { courseId },
      {
        Authorization: `Bearer ${token}`,
      }
    );

    console.log("🛑 Class ended");

  } catch (err) {
    console.error(err);
  }
};


  useEffect(() => {
     
const appID = 520944105; // 🔥 replace with your AppID
    const serverSecret = "6406d31453601481356b38b8c2601a11"; 

    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?._id || Date.now().toString();
    const userName = user?.firstName || "User";

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomId,
      userId,
      userName
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);
    zpRef.current = zp;

    zp.joinRoom({
      container: meetingRef.current,
      scenario: {
        mode: ZegoUIKitPrebuilt.VideoConference,
      },
    });

    // 🔥 CLEANUP (MOST IMPORTANT)
    return () => {
      if (zpRef.current) {
        zpRef.current.destroy();
      }
    };

  }, [roomId]);

  return (
    <div
      ref={meetingRef}
      style={{ width: "100%", height: "100vh" }}
    />
  );
}



  
// const appID = 520944105; // 🔥 replace with your AppID
//     const serverSecret = "6406d31453601481356b38b8c2601a11"; 

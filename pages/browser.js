import { Card, Center } from '@mantine/core';
import { FullFileBrowser } from 'chonky';
import axios from 'axios';
import { useState, useEffect } from 'react'

async function requestDirectoryContent(directory) {
  var c = await axios.get("/api/browser", {
    params: {
      directory: directory
    }
  });
  return c.data;
}

export default function Browser() {
  const [content, setContent] = useState([]);
  const [folderChain, setFolderChain] = useState([null]);

  useEffect(async () => {
    var request = await requestDirectoryContent(1);
    setContent(request.content);
    setFolderChain([request.directory]);
  }, []);

  const contentAction = async (action) => {
    if (action.id === "open_files") {
      if (action.payload.targetFile.isDir === true) {
        var location = -1;
        for (var chain = 0; chain < folderChain.length; chain++) {
          if (folderChain[chain].id == action.payload.targetFile.id) {
            location = chain;
          }
        }
        var fc = [...folderChain];
        if(location > -1){
          fc = fc.slice(0, location);
        }
        setFolderChain([...fc, null]);
        setContent([]);
        var request = await requestDirectoryContent(action.payload.targetFile.originalId);
        setContent(request.content);
        setFolderChain([...fc, request.directory]);
      } else if (action.payload.targetFile.name.indexOf(".mp4") > -1){
        var url = new URL(window.location.href);
        var params = new URLSearchParams(window.location.search);
        params.set("id", action.payload.targetFile.originalId);
        url.search = params;
        url.pathname = "/waves";
        url = url.toString();
        window.location = url;
      }
    } 
  }

  return (
    <Center className="w-screen h-screen bg-sky-600">
      <Center className="w-4/5 h-4/5">
        <Card className="w-full h-full">
          <FullFileBrowser files={content} folderChain={folderChain} onFileAction={contentAction} />
        </Card>
      </Center>
    </Center>
  )
}
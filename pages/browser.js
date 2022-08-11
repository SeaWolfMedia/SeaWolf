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
  const [initialLoad, setInitialLoad] = useState(false);
  const [content, setContent] = useState([]);
  const [folderChain, setFolderChain] = useState([]);

  useEffect(() => {
    if (initialLoad === false) {
      requestDirectoryContent(1).then((data) => {
        setContent(data.content);
        setFolderChain([data.directory]);
        setInitialLoad(true);
      })
    }
  });

  const contentAction = async (action) => {
    if (action.id === "open_files") {
      if (action.payload.targetFile.isDir === true) {
        var location = -1;
        for (var chain = 0; chain < folderChain.length; chain++) {
          if (folderChain[chain].id == action.payload.targetFile.id) {
            location = chain;
          }
        }
        if(location > -1){
          setFolderChain(folderChain.slice(0, location + 1));
        } else {
          setFolderChain([...folderChain, action.payload.targetFile]);
        }
        setContent([]);
        setContent((await requestDirectoryContent(action.payload.targetFile.originalId)).content);
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
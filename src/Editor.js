import React, { useState, useEffect } from "react";
import { Controlled as CodeMirror } from "react-codemirror2";

import "codemirror/keymap/vim";
import "codemirror/mode/gfm/gfm";
import "codemirror/lib/codemirror.css";

import StandardNotes from "./StandardNotes";
import "./Editor.scss";

function Editor() {
  const [noteContent, setNoteContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const editing = useTimeout(noteContent, 2000);

  useEffect(() => {
    const subscription = StandardNotes.getNoteContentUpdates().subscribe(
      content => {
        if (!editing) {
          setNoteContent(content);
          setDirty(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [editing]);

  useEffect(() => {
    if (noteContent !== null) {
      setLoading(false);
    }
  }, [noteContent]);

  useEffect(() => {
    if (noteContent !== null && dirty) {
      StandardNotes.saveNoteContent(noteContent);
    }
  }, [noteContent, dirty]);

  return (
    <React.Fragment>
      {loading ? (
        "LOADING"
      ) : (
        <CodeMirror
          value={noteContent}
          editorDidMount={editor => {
            editor.refresh();
          }}
          options={{
            mode: "gfm",
            keyMap: "vim"
          }}
          onBeforeChange={(editor, data, value) => {
            setDirty(true);
            setNoteContent(value);
          }}
        />
      )}
    </React.Fragment>
  );
}

const useTimeout = (value, delay) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (value == null) {
      return;
    }

    setActive(true);

    const timeout = setTimeout(() => {
      setActive(false);
    }, delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [value, delay]);

  return active;
};

export default Editor;

import React, { useState, useEffect } from "react";
import { Controlled as CodeMirror } from "react-codemirror2";

import StandardNotes from "./StandardNotes";

import "codemirror/mode/markdown/markdown";
import "codemirror/keymap/vim";
import "codemirror/lib/codemirror.css";

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
    <div style={{ padding: "16px" }}>
      {loading ? (
        "LOADING"
      ) : (
        <CodeMirror
          value={noteContent}
          editorDidMount={editor => {
            editor.refresh();
          }}
          options={{
            mode: "markdown",
            keyMap: "vim"
          }}
          onBeforeChange={(editor, data, value) => {
            setDirty(true);
            setNoteContent(value);
          }}
        />
      )}
      Dirty: {JSON.stringify(dirty)}
      Editing: {JSON.stringify(editing)}
    </div>
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

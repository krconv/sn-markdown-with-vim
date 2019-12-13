import React, { useCallback, useEffect, useRef, useState } from "react";
import "codemirror/keymap/vim";
import StandardNotes from "./StandardNotes";

import "./Editor.scss";

var HyperMD = require("hypermd");

export default function Editor() {
  const ref = useRef();
  const [note, setNote] = useState(null);
  const loading = useRef(false);
  const [editor, setEditor] = useState(null);
  const [styleSheet, setStyleSheet] = useState(null);

  useEffect(() => {
    setEditor(
      HyperMD.fromTextArea(ref.current, {
        keyMap: StandardNotes.isMobileDevice() ? "default" : "vim",
        lineNumbers: false
      })
    );
  }, [ref]);

  useEffect(() => {
    if (editor) {
      const subscription = StandardNotes.getNoteUpdates().subscribe(newNote => {
        const didNoteChange = !note || note.uuid !== newNote.uuid;

        if (didNoteChange) {
          editor.getDoc().clearHistory();
          editor.getDoc().markClean();
        }
        setNote(newNote);
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [editor, note]);

  useEffect(() => {
    if (editor && note) {
      const isOutOfSync =
        editor.getDoc().isClean() &&
        editor.getDoc().getValue() !== note.content.text;
      if (isOutOfSync) {
        loading.current = true;
        editor.getDoc().setValue(note.content.text);
        loading.current = false;
      }
    }
  }, [editor, note]);

  const handleEditorChange = useCallback(() => {
    if (!loading.current) {
      StandardNotes.saveNoteContent(editor.getValue(), () => {
        editor.getDoc().markClean();
        return editor.getDoc().getValue();
      });
    }
  }, [editor, loading]);

  useEffect(() => {
    if (editor) {
      editor.on("change", handleEditorChange);

      return () => {
        editor.off("change", handleEditorChange);
      };
    }
  }, [editor, handleEditorChange]);

  useEffect(() => {
    var style = document.createElement("style");
    document.head.appendChild(style);
    setStyleSheet(style.sheet);
  }, []);

  const updateCursorPosition = useCallback(() => {
    if (editor) {
      const { size, position } = calculateCursor(editor);
      updateCursor(position, size, styleSheet);
    }
  }, [editor, styleSheet]);

  useEffect(() => {
    if (editor) {
      editor.on("cursorActivity", updateCursorPosition);
      editor.on("update", updateCursorPosition);

      return () => {
        editor.off("cursorActivity", updateCursorPosition);
        editor.off("update", updateCursorPosition);
      };
    }
  }, [editor, updateCursorPosition]);

  return <textarea ref={ref} />;
}

const calculateCursor = editor => {
  const coords = getCursorCoords(editor);
  const character = getCharacterAtCoords(coords, editor) || "X";

  const classes = getClassesAtCoords(coords, editor);

  const { characterElement, lineElement } = simulateCharacter(
    character,
    classes,
    editor
  );

  const position = calculateCursorPosition(
    measureElementOffset(lineElement, characterElement),
    editor
  );

  return {
    size: measureElementSize(characterElement),
    position
  };
};

const getCursorCoords = editor => {
  return editor.coordsChar(editor.cursorCoords());
};

const getCharacterAtCoords = (coords, editor) => {
  const line = editor.getLine(coords.line);
  return line.charAt(coords.ch);
};

const getClassesAtCoords = (coords, editor) => {
  return {
    line: getClassesForLine(coords, editor),
    ch: getClassesForCharacter(coords, editor)
  };
};

const getClassesForLine = (coords, editor) => {
  const lineViews = editor.display.renderedView;
  const lineView = lineViews[coords.line];

  return (lineView && lineView.textClass) || "";
};

const getClassesForCharacter = (coords, editor) => {
  return editor.getTokenTypeAt(coords);
};

const simulateCharacter = (character, classes, editor) => {
  const characterElement = buildCharacterElement(character, classes.character);
  const lineElement = buildLineElement(characterElement, classes.line);
  simulateLine(lineElement, editor);
  return { characterElement, lineElement };
};

const buildCharacterElement = (character, className) => {
  const content = document.createTextNode(character);
  return buildElement("span", className, content);
};

const buildLineElement = (characterElement, className) => {
  return buildElement("pre", className, characterElement);
};

const buildElement = (type, className, child) => {
  const element = document.createElement(type);
  element.className = className;
  element.appendChild(child);
  return element;
};

const simulateLine = (lineElement, editor) => {
  const parent = editor.display.measure;
  removeAllChildren(parent);
  parent.appendChild(lineElement);
};

const removeAllChildren = element => {
  while (element.childNodes.length > 0) {
    element.removeChild(element.firstChild);
  }
};

const measureElementSize = element => {
  const rect = element.getBoundingClientRect();
  return {
    width: rect.right - rect.left,
    height: rect.bottom - rect.top
  };
};

const measureElementOffset = (outter, inner) => {
  const outterRect = outter.getBoundingClientRect();
  const innerRect = inner.getBoundingClientRect();
  return {
    left: innerRect.left - outterRect.left,
    top: innerRect.top - outterRect.top
  };
};

const calculateCursorPosition = (offset, editor) => {
  const base = editor.cursorCoords(true, "local");
  return {
    left: base.left + offset.left,
    top: base.top + offset.top
  };
};

const updateCursor = (position, size, styleSheet) => {
  if (size && position && styleSheet) {
    try {
      styleSheet.deleteRule(0);
    } catch (err) {}

    styleSheet.insertRule(
      `.CodeMirror-cursor {
         width: ${size.width}px !important;
         height: ${size.height + 4}px !important;
         top: ${position.top - 4}px !important;
       }`,
      0
    );
  }
};

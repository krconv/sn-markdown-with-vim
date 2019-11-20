import ComponentManager from "sn-components-api";
import * as rx from "rxjs";
import { filter, map } from "rxjs/operators";

class StandardNotes {
  constructor() {
    this.noteUpdates = new rx.BehaviorSubject(null);

    const permissions = [
      {
        name: "stream-context-item"
      }
    ];

    this.componentManager = new ComponentManager(permissions, () => {});

    this.componentManager.streamContextItem(note => {
      this.noteUpdates.next(note);
    });
  }

  getNoteUpdates() {
    return this.noteUpdates.pipe(filter(note => note));
  }

  getNoteContentUpdates() {
    return this.getNoteUpdates().pipe(
      map(note => (note ? note.content.text : null))
    );
  }

  saveNoteContent(content) {
    return new Promise(resolve => {
      const note = this.noteUpdates.getValue();
      note.content.text = content;
      this.componentManager.saveItem(note, resolve);
    });
  }
}

export default new StandardNotes();

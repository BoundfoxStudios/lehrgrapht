import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Plot } from '../../models/plot';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  ngOnDestroy(): void {
    Office.context.document.removeHandlerAsync(
      Office.EventType.DocumentSelectionChanged,
    );
  }

  ngOnInit(): void {
    console.log('Register handler');
    Office.context.document.addHandlerAsync(
      Office.EventType.DocumentSelectionChanged,
      (_: Office.DocumentSelectionChangedEventArgs) =>
        Word.run(async context => {
          console.log('yupp');
          const range = context.document.getSelection();
          await context.sync();
          range.inlinePictures.load('items');
          await context.sync();

          if (range.inlinePictures.items.length > 0) {
            const image = range.inlinePictures.items[0];

            if (image.altTextDescription.startsWith('plot')) {
              const id = image.altTextDescription;
              const params = Office.context.document.settings.get(id) as
                | Plot
                | undefined;

              if (params) {
                console.log(params);
              } else {
                console.log('no params found');
              }
            } else {
              console.log('No parent content control found?!');
            }
          }
        }),
    );
  }
}

# Gesture Pong

A one-player Pong game controlled by arm motions in front of your webcam. A custom image classifier, trained with Google's [Teachable Machine](https://teachablemachine.withgoogle.com/), reads each webcam frame as **Up**, **Down**, or **Neutral**. The prediction moves the paddle in real time.

University of Washington class project, cleaned up in 2026.

<!-- Add a GIF of gameplay here: ![Gameplay](demo.gif) -->

## How it works

1. **Training data.** I recorded webcam images of three arm positions in Teachable Machine: one for Up, one for Down, and one for Neutral.
2. **Model.** Teachable Machine trains a classifier on those images using transfer learning on a pretrained vision model (MobileNet), then hosts it at a URL.
3. **Live classification.** [ml5.js](https://ml5js.org/) loads that model in the browser and classifies webcam frames continuously. Each result starts the next classification.
4. **Game control.** [p5.js](https://p5js.org/) draws the game. The latest confident label moves the paddle each frame.

```
webcam frame → image classifier → label + confidence → paddle movement
```

## Designing around detection limits

Controlling a game with your arms is slower and less precise than a keyboard. The classifier also sees only still frames, so it can't tell a motion from a pose, and each prediction arrives slightly after the camera captures it. I designed the game around those limits:

- **Poses, not motions.** Each class is a held arm position the model can recognize from a single frame, instead of a movement it would need several frames to see.
- **A tall paddle.** At 300 pixels, it gives you room for detection lag and for the time it takes to move your arms.
- **Steady paddle speed.** The paddle moves a fixed amount per frame while a pose is held, so a single misread frame can't jump it across the screen.
- **A Neutral class.** Resting arms map to "do nothing," so the paddle stays put between moves instead of drifting.

## Other design choices

- **Confidence threshold (80%).** Predictions below the threshold count as Neutral. This stops the paddle from jittering when the model is unsure, such as when your arms are between poses.
- **Keyboard fallback.** Arrow keys always work, so the game stays playable if the camera or model fails.
- **Small input frames.** The classifier reads 224×224 frames, the size MobileNet expects, which keeps predictions fast.
- **Camera preview.** A small preview in the corner shows what the model sees, which helps when lighting or hand position confuses it.

## Run it

The webcam needs the page to be served, not opened as a file.

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 and allow camera access.

- Hold your **Up** pose to move the paddle up, **Down** to move it down.
- You have 3 lives.
- Press **Space** to restart after game over.

## Use your own model

The hosted model may not match your body, lighting, or camera. To train your own:

1. Go to [Teachable Machine](https://teachablemachine.withgoogle.com/) → **Image Project** → **Standard image model**.
2. Create three classes named exactly `Up`, `Down`, and `Neutral`. Record about 100–200 webcam images each.
3. Click **Train Model**, then **Export Model** → **Upload (shareable link)**.
4. Paste your link into `MODEL_URL` at the top of `sketch.js`.

## What changed in the 2026 cleanup

- Fixed paddle collision, which counted any ball below the paddle's top edge as a hit
- Added a miss condition, lives, and game over (before, the ball bounced off the left wall, so you couldn't lose)
- Kept walls and paddle inside the 800×800 canvas instead of the browser window
- Added the confidence threshold, keyboard fallback, and camera preview
- Removed unused variables and dead code

## Credits

The classify-then-reclassify loop is adapted from The Coding Train's ml5.js and Teachable Machine examples by Daniel Shiffman.

## Built with

p5.js 1.9.4 · ml5.js 0.12.2 · Teachable Machine

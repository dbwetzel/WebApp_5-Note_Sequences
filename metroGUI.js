const metroGUI = (p) => {
  var tempoBox,
    transportStart,
    metroStart,
    tempoSlider,
    syncSlider,
    volSlider,
    swingSlider,
    tempo = 120, muteDB, mute2and4, mute3, mute8ths;
  //const synthA = new Tone.FMSynth().toDestination();
  //const synthB = new Tone.AMSynth().toDestination();
  const drumSampler = new Tone.Sampler({
    urls: {
      A3: "drums/Kick.wav",
      "A#3": "drums/Kick.wav",
      B3: "drums/Snare.wav",
      C4: "drums/Claps.wav",
      "C#4": "drums/Shot1.wav",
      "D#4": "drums/Shot2.wav",
      D4: "drums/WhiteNoise.wav",
      E4: "drums/ReverseCymbal.wav",
      F4: "drums/HiHat_Closed.wav",
      "F#4": "drums/HiHat_Open.wav",
    },
  });

  // volume control for metronome ...
  const gainNode = new Tone.Gain(0.8).toDestination();
  drumSampler.connect(gainNode);

  //play a note every quarter-note
  const loopA = new Tone.Loop((time) => {
    drumSampler.triggerAttackRelease("A3", "4n", time);
  }, "4n"); // kick

  const loopB = new Tone.Loop((time) => {
    drumSampler.triggerAttackRelease("C4", "4n", time);
  }, "2n"); // hand clap

  let patterns = [
    [
      { time: 0, pitch: "A3", dur: "8n" },
      { time: "0:1:0", pitch: "A3", dur: "8n" },
      { time: "0:2:0", pitch: "A3", dur: "8n" },
      { time: "0:3:0", pitch: "A3", dur: "8n" },
    ],
    [
      { time: 0, pitch: "F4", dur: "16n" },
      { time: 0, pitch: "A3", dur: "4n" },
      { time: "0:0:2", pitch: "F4", dur: "16n" },
      { time: "0:1:0", pitch: "F4", dur: "16n" },
      { time: "0:1:0", pitch: "C4", dur: "16n" },
      { time: "0:1:2", pitch: "F4", dur: "16n" },
      { time: "0:2:0", pitch: "F4", dur: "16n" },
      { time: "0:2:0", pitch: "B3", dur: "16n" },
      { time: "0:2:2", pitch: "F4", dur: "16n" },
      { time: "0:3:0", pitch: "F4", dur: "16n" },
      { time: "0:3:0", pitch: "C4", dur: "16n" },
      { time: "0:3:2", pitch: "F4", dur: "16n" },
    ],
  ];
  let pattern = 1;
  const downBeat = new Tone.Part(
    (time, val) => {
      drumSampler.triggerAttack(val.pitch, time, 0.8);
    },
    [{ time: 0, pitch: "A3" }]
  );
  downBeat.loopEnd = "1m"; // one measure
  downBeat.loop = true;

  const eighths = new Tone.Part(
    (time, val) => {
      drumSampler.triggerAttack(val.pitch, time, 0.5);
    },
    [
      { time: 0, pitch: "F4", dur: "16n" },
      { time: "0:0:2", pitch: "F4", dur: "16n" },
      { time: "0:1:0", pitch: "F4", dur: "16n" },
      { time: "0:1:2", pitch: "F4", dur: "16n" },
      { time: "0:2:0", pitch: "F4", dur: "16n" },
      { time: "0:2:2", pitch: "F4", dur: "16n" },
      { time: "0:3:0", pitch: "F4", dur: "16n" },
      { time: "0:3:2", pitch: "F4", dur: "16n" }
    ]
  );
  eighths.loopEnd = "1m"; // one measure
  eighths.loop = true;

  const beat2and4 = new Tone.Part(
    (time, val) => {
      drumSampler.triggerAttack(val.pitch, time, 0.6);
    },
    [
      { time: "0:1:0", pitch: "C4", dur: "16n" },
      { time: "0:3:0", pitch: "C4", dur: "16n" }
    ]
  );
  beat2and4.loopEnd = "1m"; // one measure
  beat2and4.loop = true;
  
  const beat3 = new Tone.Part(
    (time, val) => {
      drumSampler.triggerAttack(val.pitch, time, 0.7);
    },
    [
      { time: "0:2:0", pitch: "B3", dur: "16n" }
    ]
  );
  beat3.loopEnd = "1m"; // one measure
  beat3.loop = true;
  
  const drumPart = new Tone.Part((time, val) => {
    drumSampler.triggerAttackRelease(val.pitch, val.dur, time);
  }, patterns[1]);
  drumPart.loop = true;

  p.setTempo = function(_bpm){
    tempo = Number(_bpm);
    tempoBox.value(tempo);
    tempoSlider.value(tempo);
  }
  
  p.setup = function () {
    p.createCanvas(500, 100);
    
    transportStart = p.createButton("Start Transport");
    transportStart.style("font-size : 12px");
    transportStart.style("height: 25px;");
    transportStart.style(
      "border: 3px solid rgb(128, 0, 0); border-radius: 8px"
    );
    transportStart.style("color : rgb(128, 0, 0); background-color: #ffd700");
    transportStart.position(20, 29);
    transportStart.mousePressed(() => {
      if (
        Tone.getTransport().state == "stopped" ||
        Tone.getTransport().state == "paused"
      ) {
        Tone.getTransport().start();
        transportStart.html("Stop Transport");
        console.log("Transport " + Tone.getTransport().state);
      } else {
        Tone.getTransport().stop();
        console.log("Transport " + Tone.getTransport().state);
        transportStart.html("Start Transport");
      }
    });

    // Metronome start/stop button
    metroStart = p.createButton("Start Metro");
    metroStart.style("font-size : 12px");
    metroStart.position(20, 55);
    metroStart.style("height: 25px;");
    metroStart.style("border: 3px solid rgb(128, 0, 0); border-radius: 8px");
    metroStart.style("color : rgb(128, 0, 0); background-color: #ffd700");
    metroStart.mousePressed(() => {
      //console.log("start metro");
      // await Tone.start();
      if (Tone.getTransport().state == "stopped") {
        Tone.getTransport().start();
        console.log("Transport " + Tone.getTransport().state);
      }
      // console.log(loopA.state);
      //            if(loopA.state == "stopped"){
      if (downBeat.state == "stopped") {
        //                loopA.start("+4n");
        //                loopB.start("+2n");
        let t = Tone.getTransport().position;
        let times = t.split(":");
        times[2] = 0; // set to downbeat;
        times[1] = 0; // set to first beat
        times[0] = Number(times[0]) + 1; // move up to the next measure;
        t = times[0] + ":" + times[1] + ":" + times[2];
        //drumPart.start(t);
        downBeat.start(t);
        beat3.start(t);
        beat2and4.start(t);
        eighths.start(t);
        metroStart.html("stop metro");
      } else {
        //                loopA.stop();
        //                loopB.stop();
        //drumPart.stop();
        downBeat.stop();
        beat3.stop();
        beat2and4.stop();
        eighths.stop();
        metroStart.html("start metro");
      }
    });
    
    // mute buttons for metro subdivisions
    muteDB = p.createCheckbox("1", true);
    muteDB.style("font-size: 14px; height:10px;");
    mute3 = p.createCheckbox("3", true);
    mute3.style("font-size: 14px; height:10px;");
    mute2and4 = p.createCheckbox("2&4", true);
    mute2and4.style("font-size: 14px; height:10px;");
    mute8ths = p.createCheckbox("8ths", true);
    mute8ths.style("font-size: 14px; height:10px;");

    // volume slider
    volSlider = p.createSlider(0, 1, 0.8, 0.1);
    volSlider.position(20, 85);
    volSlider.size(70);
    volSlider.changed(() => {
      console.log(`volume ${volSlider.value()}`);
      gainNode.gain.rampTo(volSlider.value(), 0.1);
    });
    
    // Tempo indicator/input
    tempoBox = p.createInput("120", "number");
    tempoBox.position(200, 60);
    tempoBox.style("font-size : 16px");
    tempoBox.style("color: rgb(128, 0, 0); background-color: #ffd700");
    tempoBox.style("border: 3px solid rgb(128, 0, 0); border-radius: 4px");
    tempoBox.size(55);
    tempoBox.changed(() => {
      //console.log(Tone.getTransport().state)
      if (Tone.getTransport().state == "stopped") {
        Tone.getTransport().start();
        console.log("Transport " + Tone.getTransport().state);
      }
      tempo = Number(tempoBox.value()); // set value of "tempo"
      tempoSlider.value(tempo); // set slider
      
      console.log("Tempo from tempo box: " + tempo);
    });

    // tempo change slider (change tempo on release)
    tempoSlider = p.createSlider(40, 200, 120, 1);
    tempoSlider.position(200, 30);
    tempoSlider.size(100);
    tempoSlider.changed(() => {
      if (Tone.getTransport().state == "stopped") {
        Tone.getTransport().start();
        console.log("Transport " + Tone.getTransport().state);
      }
      // console.log("tempo slider: " + tempoSlider.value());
      //Tone.getTransport().bpm.rampTo(tempoSlider.value(), 0.5);
      tempo = tempoSlider.value();
      tempoBox.value(tempo);

      console.log("tempo from slider " + tempo);
    });
    
    swingSlider = p.createSlider(0, 1, 0, 0.1);
    swingSlider.position(200, 90);
    swingSlider.size(70);
    swingSlider.changed(()=>{
      Tone.getTransport().swing = swingSlider.value();
      console.log(Tone.getTransport().swing);
    })

    syncSlider = p.createSlider(-0.1, 0.1, 0, 0.01);
    syncSlider.position(465, 37);
    syncSlider.size(100);
    syncSlider.changed(() => {
      syncSlider.value(0);
    });

  };

  p.draw = function () {
    eighths.mute = !mute8ths.checked();
    downBeat.mute = !muteDB.checked();
    beat2and4.mute = !mute2and4.checked();
    beat3.mute = !mute3.checked();
    
    p.background(200);
    p.textAlign(p.LEFT);
    p.textSize(16);
    // transport and metro control
    p.text("Metronome", 10, 17);
    transportStart.position(10, 22);
    metroStart.position(10, 50);
    p.textSize(12);
    p.text("Vol.:", 10, 90)
    volSlider.position(35, 84);
    
    // tempo control
    let tempoX = 135; // position the block
    p.textAlign(p.LEFT);
    p.textSize(16);
    p.text("Tempo", tempoX, 17);
    tempoSlider.position(tempoX, 30);
    p.text("BPM:", tempoX, 65);
    tempoBox.position(tempoX + 45, 45);
    p.textSize(12);
    p.text("Swing:", tempoX, 90);
    swingSlider.position(tempoX + 40, 84);
    
    // Beat sync controls
    let syncX = 430
    p.textAlign(p.CENTER);
    p.text("Beat Sync", syncX, 17);
    //        p.text(Tone.getTransport().bpm.value, 450, 55)
    syncSlider.position(syncX-40, 30)
    p.textSize(12);
    p.text(Math.round(Tone.getTransport().bpm.value) + " bpm", syncX, 60);
    
    //set bpm based on current "tempo" value
    Tone.getTransport().bpm.value = tempo + (tempo * syncSlider.value());
    
    //Bars and Beats wheel & transport display
    let t = Tone.getTransport().position;
    let times = t.split(":");
    let BnBx = 290;
    muteDB.position(BnBx + 42, 25); 
    mute2and4.position(BnBx + 42, 40); 
    mute3.position(BnBx + 42, 55); 
    mute8ths.position(BnBx + 42, 70);
    p.push();
    p.translate(BnBx, 0); // Transport counter block
    p.textAlign(p.LEFT, p.CENTER);
    p.text("Bars & Beats", -20, 10);
    //p.rect(0, 0, 100, 20);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(times[0] + ":", -5, 80);
    p.text(times[1] + ":", 5, 80);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(times[2], 5, 80);
    p.pop();
    p.push();
    p.translate(BnBx, 45); // metro dial
    //p.rotate(times[1] * p.PI/2)
    let d = 40;
    let q = (times[1] * p.PI) / 2 - p.PI / 2;
    let s = 0;
    if (times[2] > 2) {
      s = q + p.PI / 4;
    } else {
      s = q;
    }
    p.fill(150);
    p.noStroke();
    p.ellipse(0, 0, d + 5);
    p.fill("blue");
    p.ellipse((p.cos(s) * d) / 2, (p.sin(s) * d) / 2, 5);
    if (times[1] == 0) {
      p.fill("red");
      p.ellipse((p.cos(q) * d) / 2, (p.sin(q) * d) / 2, 10);
    }
    // beat number in center of circle
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.fill(255);
    p.text(Number(times[1]) + 1, 0, 0);
    
    //p.fill("blue");
    //p.arc(0, 0, 50, 50, -p.PI/2, times[1] * p.PI/2);
    //p.line(0, 0, 0, -25);
    p.pop();

    if (p.frameCount % 60 == 0 && Tone.Transport.state == "started"){
      transportStart.html("Stop Transport");
    }
  };
};

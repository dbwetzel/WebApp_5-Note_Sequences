var sequenceEditorGUI = p => {
  const chromaticScale = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const scales = {
    "CM": ["C", "D", "E", "F", "G", "A", "B", "C"],
    "DM": ["D", "E", "F#", "G", "A", "B", "C#", "D"],
    "EM": ["E", "F#", "G#", "A", "B", "C#", "D#", "E"],
    "FM": ["F", "G", "A", "Bb", "C", "D", "E", "F"],
  };

  const testSequence = {
    "name" : "Twinkle A",
    "loop" : "2m",
    "octave" : 0,
    "sequence" : [
      {"time":"0:0:0", "pitch" : "C4", "dur" : "0:0:2", "vel" : 1},
      {"time":"0:0:2", "pitch" : "C4", "dur" : "0:0:2", "vel" : 0.8},
      {"time":"0:1:0", "pitch" : "G4", "dur" : "0:0:2", "vel" : 0.8},
      {"time":"0:1:2", "pitch" : "G4", "dur" : "0:0:2", "vel" : 0.7},
      {"time":"0:2:0", "pitch" : "A4", "dur" : "0:0:2", "vel" : 0.8},
      {"time":"0:2:2", "pitch" : "A4", "dur" : "0:0:2", "vel" : 0.7},
      {"time":"0:3:0", "pitch" : "G4", "dur" : "0:1:0", "vel" : 1},
      {"time":"1:0:0", "pitch" : "F4", "dur" : "0:0:2", "vel" : 1},
      {"time":"1:0:2", "pitch" : "F4", "dur" : "0:0:2", "vel" : 0.8},
      {"time":"1:1:0", "pitch" : "E4", "dur" : "0:0:2", "vel" : 1},
      {"time":"1:1:2", "pitch" : "E4", "dur" : "0:0:2", "vel" : 0.8},
      {"time":"1:2:0", "pitch" : "D4", "dur" : "0:0:2", "vel" : 1},
      {"time":"1:2:2", "pitch" : "D4", "dur" : "0:0:2", "vel" : 0.8},
      {"time":"1:3:0", "pitch" : "C4", "dur" : "0:1:0", "vel" : 1}
    ]
  }

  var libIndex = -1; // keep track of position in library array; new sequence is -1
  var pianoRoll; // object to contain the piano roll
  var note; // individual cell for quantization
  var rows = []; // row of notes
  var sequence = []; // list of note objects?
  var seq_json = [];
  var libMenu; // select from library
  var jsonBox; // textarea to display json
  let updateButton; // save to library
  let newButton; // create new seuence
  let deleteButton; // delete current sequence from library
  let clearButton; // clear notes from current sequence
  let playButton; // play editor sequence
  var seqName; // text input for sequence name
  var loopInterval; // text input for loop length
  var quantization = 16; // number of subdivisions/bar (quantization)
  var bars = 4; // number of bars in the sequence
  var loop = "4m"; // default length for sequence loop
  var editor; // object to contain the note editor
  //var update;
  var JSONsequence = { name: "untitled", loop : "4m", octave: 0, sequence: [] };
  var sequenceLibrary = []; // holds the complete library of sequences
  var seqDiv; // div element for individual sequence players
  var sequencers = []; // sketch instances for seq players
      let cellNum = bars * quantization; // number of columns (subdivision units)
  var span = 500; // piano roll width
  var rollHeight = 267; // piano roll height
  let leftMargin = 40;
  let topMargin = 200; // margin for piano roll
  const synth = new Tone.PolySynth().toDestination();
  
  p.setSeqDiv = function(_div){
    //get a div element in which to place sequence players
    //let para = document.createElement("p");
    //para.innerText = "Sequence players go here."
    seqDiv = _div
    //seqDiv.appendChild(para);
  }
  
  p.setLibrary = function(_lib){
    sequenceLibrary = _lib;
    //console.log(sequenceLibrary);
    p.setMenu();
    // clear existing sequence players?
    let containers = document.querySelectorAll(".sequenceContainer");
    // find all divs with the class name "sequenceContainer"
    containers.forEach(item => {
      // delete node item
      item.remove();
    });
    console.log(containers);
    //load sequence players
    for(let i = 0; i < sequenceLibrary.length; i++){
      //seqDiv.innerHTML += "<p>" + sequenceLibrary[i].name + "</p>"
      p.createSequencer(seqDiv, structuredClone(sequenceLibrary[i]));
    }
  }
  
  p.createSequencer = function(_div, _seq){
    let container = document.createElement("div");
    container.className = "sequenceContainer";
    container.style="position:relative; border: 1px solid; height: 90px;"
    let newSeq = new p5(seqGUI, container);
    newSeq.setObj(_seq);
    sequencers.push(newSeq);
    _div.appendChild(container);
  }
  
  p.getLibrary = function(){
    return sequenceLibrary;
  }
  
  p.setMenu = function () {
    let names = [];
    if (Array.isArray(sequenceLibrary)) {
      for (let i = 0; i < sequenceLibrary.length; i++) {
        names.push(sequenceLibrary[i].name); // get set names   
      }
      console.log(names);
    }
    names = renameRepeatOccurrences(names);// make sure it's unique

    if (libMenu) {
      libMenu.remove(); // kill it!
    }
    libMenu = p.createSelect(); // make a new one
    //libMenu.position(leftMargin, 10);
    libMenu.addClass("menu");
    libMenu.size(130);
    libMenu.option("edit sequence ...", -1);

    for (let i = 0; i < names.length; i++) {
      libMenu.option(names[i], i);
    }
    if(names.length > 0){
      //libMenu.disable(-1);
    }
    //console.log("setMenu()");
    libMenu.changed(p.loadSeq);
  };
  
  function renameRepeatOccurrences(arr) {
    // courtesy Google AI, 10/20/25
    const counts = new Map(); // key:value pairs
    const result = [];
    for (const item of arr) {
      let newItem = item; // default keep it
      let count = counts.get(item) || 0; // check if it's in the Map
      // count is either "undefined" or a number value
      if (count > 0) {
        newItem = `${item} (${count})`;
        // Check for potential collisions with already renamed items (e.g., "a (1)" and "a (1) (1)")
        while (counts.has(newItem)) {
          count++;
          newItem = `${item} (${count})`;
        }
      }
      counts.set(item, count + 1); // Increment count for the original item
      counts.set(newItem, (counts.get(newItem) || 0) + 1); // Track the new item as well
      result.push(newItem);
    }
    return result;
  }

  p.loadSeq = function(){
    // load a sequence for editing
    let i = libMenu.selected();
    // console.log(i);
    if(i > -1){
      //libMenu.disable(-1);
      libIndex = i;
      p.loadSequence(sequenceLibrary[i]);
    }
  }

  p.setup = function() {
    p.createCanvas(550, 550);
     
    pianoRoll = new Roll(
      p,
      leftMargin,
      topMargin,
      span,
      rollHeight,
      cellNum / 4,
      quantization,
      chromaticScale
    );
    // console.log(pianoRoll)

    editor = new Editor(
      p,
      leftMargin,
      topMargin + rollHeight + 18,
      pianoRoll.s,
      pianoRoll.range,
      bars,
      pianoRoll
    );
    
    libMenu = p.createSelect();
    //libMenu.position(leftMargin, 10);
    libMenu.option("Edit Sequence ...", -1);
    
    seqName = p.createInput("New Sequence");
    seqName.size(120);
    //seqName.position(leftMargin + span - 120, topMargin - 100);
    seqName.changed(()=>{
      JSONsequence.name = seqName.value();
    });

    loopInterval = p.createInput(loop); // default "4m"
    loopInterval.size(70);
//  loopInterval.position(leftMargin + span - 70, topMargin - 60);
    loopInterval.changed(() => {
      
      let t = Tone.Time(loopInterval.value()).toSeconds();
      //nonsense values will return null
      if(t){ // check validity first ...
        console.log(t);
        JSONsequence.loop = Tone.Time(t).toBarsBeatsSixteenths();
        update();

      } else {
        loopInterval.value("4m"); // back to default 4 measures
        JSONsequence.loop = Tone.Time("4m").toBarsBeatsSixteenths();
        update();
      }
    })

    playButton = p.createButton("Play >");
    //playButton.position(leftMargin, 95);
    playButton.addClass("button");
    playButton.mousePressed(play);

    updateButton = p.createButton("Save to Library");
    updateButton.size(120);
    updateButton.addClass("button");
    updateButton.mousePressed(saveSequence); 

    newButton = p.createButton("New Sequence");
    newButton.size(120);
    newButton.addClass("button");
    newButton.mousePressed(newSequence); 
    
    clearButton = p.createButton("Clear All Notes");
    clearButton.size(120);
    clearButton.addClass("button");
    clearButton.mousePressed(clearSequence); 

    deleteButton = p.createButton("Delete Sequence");
    deleteButton.size(120);
    deleteButton.addClass("button");
    deleteButton.mousePressed(deleteSequence); 
    
    jsonBox = p.createElement("textarea");
    jsonBox.attribute("readOnly", true);
    jsonBox.attribute("cols", 27); 
    jsonBox.attribute("rows", 12); 
    jsonBox.style("font-size", "x-small");
    //jsonBox.position(leftMargin + 170, 20);
    jsonBox.value(JSON.stringify(sequence, null, 2));

    update();
    
  }

  function newSequence(){
    console.log("new sequence");
    p.init(); // load default sequence to editor
    //sequenceLibrary.push(structuredClone(JSONsequence)); // append to the library
    //p.setLibrary(sequenceLibrary); // reset menu and load players
    //libMenu.selected(sequenceLibrary.length-1); // set menu to new item
    libMenu.option("New (unsaved)", -2);
    libMenu.selected(-2);
  }
  
  p.init = function() {
    // initialize the sequence editor for a new sequence
    libIndex = -1; // reset to new sequence index value (not part of library yet)
    sequence = []; // blank sequence
    seqName.value("New Sequence");
    loopInterval.value("4m");
    //update(); // now handled from draw()
  }
  
  function clearSequence(){
    console.log("clear all notes from current sequence");
    sequence = [];
  }
  
  function deleteSequence(){
    console.log("delete current sequence from library");
    if(libMenu.selected() < 0){
      console.log("choose a sequence from the menu first")
    } else{
      console.log("deleting sequece " + libMenu.selected());
      let i = libMenu.selected();
      console.log(sequenceLibrary[i]);
      sequenceLibrary.splice(i, 1);
      p.setLibrary(sequenceLibrary);
      p.init();
      // rebuild player (seqGUI) list
    }
  }
  
  function saveSequence(){
    console.log("save current sequence to library");
    //replace current index with
    if(libIndex < 0){
      // lib index -1 means new unsaved sequence
      sequenceLibrary.push(structuredClone(JSONsequence));
      libIndex = sequenceLibrary.length -1;
      // append to the library instead
    } else {
      // active library selected, so replace it with the working copy
      sequenceLibrary.splice(libIndex, 1, structuredClone(JSONsequence));
    }
    p.setLibrary(sequenceLibrary);
    libMenu.selected(libIndex); // set to current sequence
  }
  
  function play(){
    console.log("play");
    //update();
    Tone.start();
    if(Tone.getTransport().state == "stopped"){
      Tone.getTransport().start();
      // start transport if it's stopped
    }

    //const synth = new Tone.PolySynth().toDestination();
    // use an array of objects as long as the object has a "time" attribute
    const part = new Tone.Part(((time, value) => {
    // the value is an object which contains both the note and the velocity
      synth.triggerAttackRelease(value.pitch, value.dur, time, value.vel);
  }), JSONsequence.sequence).start(nextMeasure());

    // console.log(Tone.getTransport().state);
    const synth2 = new Tone.PolySynth().toDestination();
    let start = 0
    const chordEvent = new Tone.ToneEvent(((time, inc) => {
      // the chord as well as the exact time of the event
      // are passed in as arguments to the callback function
      //synth2.triggerAttackRelease(chord, "32n", time);
      //console.log(start);
      Tone.getDraw().schedule(()=>{
        pianoRoll.moveCursor();
      });
      start += inc;
    }), 1);
    // start the chord at the beginning of the transport timeline
    chordEvent.start(nextMeasure());
    // loop it every measure for 8 measures
    chordEvent.loop = bars * quantization;
    chordEvent.loopEnd = "16n";
      
  }

  function nextMeasure(){
    let t = Tone.Transport.position;
    let times = t.split(':');
    times[2] = 0; // set to downbeat;
    times[1] = 0; // set to first beat
    times[0] = Number(times[0]) + 1; // move up to the next measure;
    t = times[0] + ":" + times[1] + ":" + times[2];    
    return t
  }

  function update(){
    //JSONsequence is a working copy of the sequence loaded in the editor
    JSONsequence.name = seqName.value();
    JSONsequence.loop = Tone.Time(loopInterval.value()).toBarsBeatsSixteenths();
    JSONsequence.sequence = [];
    for (let i = 0; i < sequence.length; i++) {

      JSONsequence.sequence.push({});
      JSONsequence.sequence[i].time = sequence[i].time;
      JSONsequence.sequence[i].pitch = sequence[i].pitch;
      JSONsequence.sequence[i].dur = sequence[i].dur;
      JSONsequence.sequence[i].vel = sequence[i].vel;
      JSONsequence.sequence[i].order =
        Tone.Time(sequence[i].time).toMilliseconds() + sequence[i].degree / 10;
    }
    //books.sort(function(a, b) {
    //return a.title.localeCompare(b.title);
    //});
    JSONsequence.sequence.sort((a, b) => {
      const noteA = a.order; 
      const noteB = b.order; 
      if (noteA < noteB) {
        return -1;
      }
      if (noteA > noteB) {
        return 1;
      }
      // names must be equal
      return 0;
    });

    for(let i = 0; i < JSONsequence.sequence.length; i++){
      delete JSONsequence.sequence[i].order;
    }

    jsonBox.value(JSON.stringify(JSONsequence, null, 2));
    pianoRoll.loop = loopInterval.value();
  }

  p.draw = function() {
    
    if(p.frameCount % 60 == 0){
      update(); // update JSONbox every second
    }
    p.background(220);
    pianoRoll.display();
    for (let i = 0; i < sequence.length; i++) {
      sequence[i].display(pianoRoll);
    }
    editor.display();
    p.text(libIndex, p.width -30, 20);

    // position the DOM elements
    libMenu.position(leftMargin, 5);
    newButton.position(leftMargin, 40);
    clearButton.position(leftMargin, 70);
    deleteButton.position(leftMargin, 100);
    updateButton.position(leftMargin, 130);
    
    playButton.position(leftMargin + 160, 20);
    playButton.size(100, 50)
    p.text("sequence name: (edit)", leftMargin + 160, topMargin - 105);
    p.text("loop interval:", leftMargin + 160, topMargin - 65);seqName.position(leftMargin + 160, topMargin - 100);
    loopInterval.position(leftMargin + 160, topMargin - 60);
    
    p.text("Sequence Data (JSON):", leftMargin + span - 200, 15)
    jsonBox.position(leftMargin + span - 200, 20);
  
  }

  p.setIndex = function(i){
    libIndex = i;
  }

  p.getIndex = function(){
    return libIndex;
  }

  p.loadSequence = function(_seq){
    //console.log("load sequence:")
    //console.log(JSON.stringify(_seq));
    if(_seq.hasOwnProperty("sequence")){
      //console.log("load sequence!");
      sequence = []; // clear the existing sequence array
      for(let i = 0; i < _seq.sequence.length; i ++){
        let note = new Note (p, _seq.sequence[i]);
        sequence.push(note);
      }
    }
    seqName.value(_seq.name);
    loopInterval.value(_seq.loop);
    //update();
  }

  p.getSequence = function(){
    //update();
    return [libIndex, JSONsequence];
  }

  p.mousePressed = function() {
    //note.click(mouseX, mouseY);
    //note.color = 0;
    let pitch, dur, vel;
    let hit = false;
    for (let i = 0; i < sequence.length; i++) {
      if (sequence[i].click(p.mouseX, p.mouseY)) {
        hit = true;
        pitch = sequence[i].pitch;
        dur = Tone.TransportTime(sequence[i].dur).toSeconds();
        vel = sequence[i].vel;

        console.log(`${pitch}, ${dur}, ${vel}`);
        synth.triggerAttackRelease(pitch, dur, Tone.now(), vel);

        console.log(sequence[i]);
        editor.edit(sequence, i);        
      }
      if (
        !hit &&
        p.mouseX > pianoRoll.x &&
        p.mouseX < pianoRoll.x + pianoRoll.w &&
        p.mouseY > pianoRoll.y &&
        p.mouseY < pianoRoll.y + pianoRoll.h
      ) {
        editor.hide();
        for (let i = 0; i < sequence.length; i++) {
          sequence[i].outline = 1;
        }
      }
    }
    if(hit){

    }
    if (p.keyIsDown(p.SHIFT)) {
      let deleteNote = false;
      for (let i = 0; i < sequence.length; i++) {
        if (sequence[i].click(p.mouseX, p.mouseY)) {
          //console.log(sequence[i]);
          sequence.splice(i, 1); // remove from array
          deleteNote = true;
          editor.hide();
          //console.log(sequence.length);
        }
      }

      // create a new note and add it to the sequence
      //console.log("shift click")
      // use this to add a note on the grid
      if (!deleteNote) {
        for (let i = 0; i < pianoRoll.rows.length; i++) {
          for (let j = 0; j < pianoRoll.rows[i].length; j++) {
            if (
              pianoRoll.rows[i][j].click(
                p.mouseX - pianoRoll.x,
                p.mouseY - pianoRoll.y
              )
            ) {
              let note = new Note(p,
                pianoRoll.rows[i][j].position()
              ); // .position() returns a default note object derived from the grid position clicked
              console.log("new note: " + JSON.stringify(pianoRoll.rows[i][j].position()));
              sequence.push(note);
              editor.edit(sequence, sequence.length - 1);
            }
          }
        }
      }
    }
  }
}

/*
 * Piano Roll container for sequence layout
 */
class Roll {
  constructor(_p5, _x, _y, _w, _h, _b, _q, _s) {
    /**
     * Piano Roll is the container for a sequence editor
     * It contains a grid for quantizing new notes as they are added
     * It handles the display of the grid
     */
    this.p5 = _p5; // p5 instance
    this.x = _x; // horizontal position
    this.y = _y; // vertical position
    this.w = _w; // overall display width
    this.h = _h; // display height
    this.q = 16; //quantization (e.g. 16 for "16n")
    this.beats = _b; // number of beats
    this.rows = []; // array of rows
    this.range = 25; // pitch range (chromatic)
    this.s = _s; // scale
    this.oct = 3; // starting octave
    this.pitch = "D"; // starting pitch
    this.pitchSet = []; // array of pitch names
    this.cursor = 0;
    this.loop = "4m"; 

    let oct = this.oct;
    let p = this.pitch;
    let start = this.s.indexOf(this.pitch);
    //console.log("starting note: " + start);
    if(start < 0){ // no match in the scale array
      start = 0;
    }
    for(let i = 0; i < this.range; i++){
      let note = this.s[(i + start) % this.s.length] + oct;
      this.pitchSet.push(note);
      oct = Math.trunc((i + start) / (this.s.length - 1)) + this.oct
    }
    //console.log(this.pitchSet);
    
    //console.log(this.s);

    let w = this.w / (this.beats * 4); // block width
    let h = this.h / this.range; // block height

    for (let i = 0; i < this.range; i++) {
      this.rows.push([]); // add an array of subdivisions to each row
      //console.log(this.rows.length)

      for (let j = 0, m = 0, b = 0, s = 0; j < this.beats * 4; j++) {
        let x = w * j; // move over one 16th
        let y = this.h - (h * i + 1) - h; // start from the bottom

        this.rows[i].push(new Cell(_p5, x, y, w, h, i));
        this.rows[i][j].pitch = this.pitchSet[i];
//        this.rows[i][j].pitch = this.s[i % this.s.length];
//        this.rows[i][j].octave = this.oct + Math.trunc(i / this.s.length);        
        s = j % 4; // 0, 1, 2, 3
        this.rows[i][j].time = m + ":" + b + ":" + s;
        // console.log(this.rows[i][j].degree + " " + this.rows[i][j].time)
        if ((s + 1) % 4 == 0) {
          // every 4 16ths, increment beat
          b++;
          b %= 4; // count 0-3
          if(b == 0){
            m ++;
          }
        }
      }
    }
  }

  moveCursor(){
    this.cursor ++;
    if(this.cursor >= this.rows[0].length){
      this.cursor = 0;
    }
  }

  display() {
    this.p5.push(); // new matrix layer
    this.p5.translate(this.x, this.y); // reposition layer
    let rowHeight = this.h/this.rows.length;
    for (let i = 0; i < this.rows.length; i++) {
      this.p5.textSize(8);
      this.p5.text(this.pitchSet[i], -20, (this.h - i * rowHeight) - rowHeight/4);
      for (let j = 0; j < this.rows[i].length; j++) {
        this.rows[i][j].display(); // see Cell.js
      }
    }

    this.p5.noFill();
    this.p5.stroke(100);
    this.p5.rect(0, 0, this.w, this.h);

    let barline = this.w / this.beats;
    this.p5.textSize(10)
    this.p5.textAlign(this.p5.RIGHT);
    this.p5.noStroke();
    this.p5.fill(100);
    this.p5.text("beat:", -4, -12);
    this.p5.text("meas.:", -4, -25);
    for (let i = 0, m = 0; i < this.beats; i++) {
      this.p5.stroke(0);
      this.p5.line(i * barline, 0, i * barline, this.h);
      this.p5.noStroke();
      this.p5.fill(100);
      this.p5.textAlign(this.p5.LEFT);
      this.p5.text(i % 4, i * barline, -12);
      if(i % 4 == 0){
        this.p5.text(m, i * barline, -25);
        this.p5.strokeWeight(3);
        this.p5.stroke(0);
        this.p5.line(i * barline, 0, i * barline, this.h);
        this.p5.strokeWeight(1)
        m++;
      }
    }
    // draw play cursor
    this.p5.fill('green');
    this.p5.stroke('green');
    this.p5.strokeWeight(2);
    this.p5.triangle(this.rows[0][this.cursor].x, 0, this.rows[0][this.cursor].x-3, -8, this.rows[0][this.cursor].x+3, -8);
    this.p5.line(this.rows[0][this.cursor].x, 0, this.rows[0][this.cursor].x, this.h)
    
    // loop length indicator
    this.p5.stroke('orange');
    this.p5.strokeWeight(3);
    let seqLength = this.beats * Tone.Time("4n").toSeconds(); // total time
    let loopLength = Tone.Time(this.loop).toSeconds() / seqLength; // normalized value
    if(loopLength > 1){
      // keep it on the page
      loopLength = 1; // only affects orange loop indicator bar
    }
    this.p5.line(0, this.h+8, this.w * loopLength, this.h+8); // bar
    this.p5.line(0, this.h+5, 0, this.h+10); // left handle
    this.p5.line(this.w * loopLength, this.h+5, this.w * loopLength, this.h+10); // right handle
    if(loopLength > 0){
      this.p5.strokeWeight(1);
      this.p5.fill('orange');
      this.p5.rectMode(this.p5.CENTER);
      let label = "loop: " + Tone.Time(this.loop).toBarsBeatsSixteenths();
      this.p5.rect(this.w * loopLength/2, this.h+8, this.p5.textWidth(label) + 4, 12, 3)
      this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
      this.p5.fill(0);
      this.p5.noStroke();
      this.p5.text(label, this.w * loopLength/2, this.h+8);
    }
    this.p5.pop(); // end of piano roll display
  }
}

/*
* individual grid positions for the sequencer layout
* each contains a time stamp and pitch
*/
class Cell {
  constructor (_p5, _x, _y, _w, _h, _d){
    this.p5 = _p5; // P5 instance reference
    this.x = _x;
    this.y = _y;
    this.w = _w;
    this.h = _h;
    this.degree = _d;

    this.color = 255;
    this.clicked = false;
    this.l = this.x - this.w/2;
    this.r = this.x + this.w/2;
    this.t = this.y - this.h/2;
    this.b = this.y + this.h/2;
    this.pitch = "C";
    this.octave = 4; 
    this.time = "0:0:0"; // default position in sequence
  }
  
  display(){
    if(this.clicked){
      // this.color = 0
    } else {
      this.color = 255;
    }
    if(this.pitch.search(/#/) >= 0){
      this.color = 180;
    }
    else{
      this.color = 255;
    }
    this.p5.push();
    this.p5.translate(this.x, this.y)
    //this.p5.rectMode(CENTER);
    this.p5.fill(this.color);
    this.p5.stroke(200);
    this.p5.rect(0, 0, this.w, this.h);
    this.p5.fill(0);
    this.p5.textSize(5);
    this.p5.noStroke();
    //this.p5.text(this.pitch, 1, 8); 
    //this.p5.text(this.time, 2, 10);
    this.p5.pop();
  }
  
  click(x, y){
    if(x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h){
     // this.clicked = !this.clicked; 
      return true;
    }  else return false;
  }
  
   position(){
     let note = {"time" : this.time, "pitch" : this.pitch, "dur" : "0:0:1", "vel" : 1};
     return note;
  }

}

class Editor {
  constructor(_p5, _x, _y, _scale, _range, _bars, _roll) {
    this.p5 = _p5; //P5 reference
    this.note = {};
    this.x = _x;
    this.y = _y;
    this.w = 500;
    this.h = 55;
    this.sequence = [];
    this.index = 0;
    this.hidden = true;
    this.pitchSet = new Array(_range); // ** deprecate this.pitchset
    //this.roll = _roll; // Piano Roll object

    this.m = this.p5.createInput();
    this.m.attribute("type", "number");
    this.m.attribute("min", 0);
    this.m.attribute("max", _bars - 1);
    this.m.position(this.x + 10, this.y + 18);
    //this.m.size(23);
    this.m.style("font-size: 10px");
    this.m.value(0);
    this.m.id("measure");
    this.m.changed(() => {
      this.apply.removeAttribute("hidden");
    });

    this.b = this.p5.createInput();
    this.b.attribute("type", "number");
    this.b.attribute("min", 0);
    this.b.attribute("max", 3);
    this.b.position(this.x + 45, this.y + 18);
    //this.b.size(23);
    this.b.style("font-size: 10px");
    this.b.value(0);
    this.b.id("beat");
    this.b.changed(() => {
      this.apply.removeAttribute("hidden");
    });

    this.s = this.p5.createInput();
    this.s.attribute("type", "number");
    this.s.attribute("step", 1);
    this.s.attribute("min", 0.0);
    this.s.attribute("max", 3.99);
    this.s.position(this.x + 80, this.y + 18);
    // this.s.size(40);
    this.s.style("font-size: 10px");
    this.s.value(0.0);
    this.s.id("sixteenth");
    this.s.changed(() => {
      this.apply.removeAttribute("hidden");
    });

    //pitch selector
    this.p = this.p5.createSelect();
    // this.p.size(50);
    this.p.position(this.x + 140, this.y + 18);
    this.p.style("font-size: 12px");
    for (let i = _roll.range - 1; i >= 0; i--) {
//      let pitname = _scale[i % _scale.length] + (4 + Math.trunc(i / _scale.length));
      this.p.option(_roll.pitchSet[i]);
      //this.pitchSet[i] = pitname;
    }
    //this.p.selected("C4");
    this.p.changed(() => {
      this.apply.removeAttribute("hidden");
    });

    // duration
    this.dm = this.p5.createInput();
    this.dm.attribute("type", "number");
    this.dm.attribute("min", 0);
    this.dm.attribute("max", 2);
    this.dm.position(this.x + 200, this.y + 18);
    //this.dm.size(25);
    this.dm.style("font-size: 10px");
    this.dm.value(0);
    this.dm.id("durM");
    this.dm.changed(() => {
      this.apply.removeAttribute("hidden");
    });

    this.db = this.p5.createInput();
    this.db.attribute("type", "number");
    this.db.attribute("min", 0);
    this.db.attribute("max", 3);
    this.db.position(this.x + 235, this.y + 18);
    // this.db.size(25);
    this.db.style("font-size: 10px");
    this.db.value(0);
    this.db.id("durB");
    this.db.changed(() => {
      this.apply.removeAttribute("hidden");
    });

    this.ds = this.p5.createInput();
    this.ds.attribute("type", "number");
    this.ds.attribute("step", 1);
    this.ds.attribute("min", 0.0);
    this.ds.attribute("max", 3.99);
    this.ds.position(this.x + 270, this.y + 18);
    //this.ds.size(45);
    this.ds.style("font-size: 10px");
    this.ds.value(1.0);
    this.ds.id("dur16");
    this.ds.changed(() => {
      this.apply.removeAttribute("hidden");
    });

    // velocity
    this.v = this.p5.createInput();
    this.v.attribute("type", "number");
    this.v.attribute("step", 0.1);
    this.v.attribute("min", 0.0);
    this.v.attribute("max", 1.0);
    this.v.position(this.x + 335, this.y + 18);
    //this.v.size(45);
    this.v.style("font-size: 10px");
    this.v.value(1.0);
    this.v.id("vel");
    this.v.changed(() => {
      this.apply.removeAttribute("hidden");
    });

    // apply button for edits to update to graphic sequencer
    this.apply = this.p5.createButton("apply");
    this.apply.position(this.x + 395, this.y + 18);
    this.apply.attribute("hidden", "hidden");
    this.apply.style("font-size: 10px");
    this.apply.mousePressed(() => {
      console.log("apply!");
      console.log(Tone.Time("0:0:0").toMilliseconds());
      if(this.sequence.length > 0){
        if(this.sequence[this.index].hasOwnProperty("time")){
          this.sequence[this.index].time = this.m.value() + ":" + this.b.value() + ":" + this.s.value();
          this.sequence[this.index].pitch = this.p.value();
          this.sequence[this.index].dur = this.dm.value() + ":" + this.db.value() + ":" + this.ds.value();
          this.sequence[this.index].vel = Number(this.v.value());
        }
      }
      // console.log(JSON.stringify(this.sequence));
      // console.log(this.index);
      if(Tone.Time(this.sequence[this.index].dur).toMilliseconds() == 0){
        this.sequence.splice(this.index, 1);
        console.log("delete for 0 dur");
        // remove from sequence if dur is 0
        this.hide();
      }
    });
    this.hide();
  }
  
  // hide the editor (default or when user click in blank space)
  hide(){
    this.hidden = true;
    this.m.attribute("hidden", "hidden");
    this.b.attribute("hidden", "hidden");
    this.s.attribute("hidden", "hidden");
    this.p.attribute("hidden", "hidden");
    this.dm.attribute("hidden", "hidden");
    this.db.attribute("hidden", "hidden");
    this.ds.attribute("hidden", "hidden");
    this.v.attribute("hidden", "hidden");
    this.apply.attribute("hidden", "hidden")
  }

  // show the editor box when user clicks on a note
  show(){
    this.hidden = false;
    this.m.removeAttribute("hidden");
    this.b.removeAttribute("hidden");
    this.s.removeAttribute("hidden");
    this.p.removeAttribute("hidden");
    this.dm.removeAttribute("hidden");
    this.db.removeAttribute("hidden");
    this.ds.removeAttribute("hidden");
    this.v.removeAttribute("hidden");
  }

  // send the clicked note to the editor
  edit(_seq, _i) {
    this.show(); // show the editor
    this.apply.attribute("hidden", "hidden"); // but hide the button
    this.sequence = _seq; // hang on to the sequence
    this.index = _i; // hang on to the index number
    _seq[_i].outline = 2; // highlight the edited note
    for (let i = 0; i < _seq.length; i++) {
      if (i != _i) {
        _seq[i].outline = 1; //unhiglight all other notes
      }
    }
    this.note = _seq[_i]; // grab a note from the sequence
    if (this.note.hasOwnProperty("time")) {
      console.log("Editor: " + "time : " + this.note.time);
      let arr = this.note.time.split(":");
      this.m.value(arr[0]);
      this.b.value(arr[1]);
      this.s.value(arr[2]);
    }
    if (this.note.hasOwnProperty("pitch")) {
      this.p.selected(this.note.pitch);
    }
    if (this.note.hasOwnProperty("dur")) {
      let t = Tone.Time(this.note.dur).toBarsBeatsSixteenths();
      //let arr = this.note.dur.split(":");
      let arr = t.split(":");
      this.dm.value(arr[0]);
      this.db.value(arr[1]);
      this.ds.value(arr[2]);
    }
    if (this.note.hasOwnProperty("vel")) {
      this.v.value(this.note.vel);
    }

    //this.m.value(); // parse "time" value
  }

  // make a nice box with some labels (P5.js)
  display() {
    this.p5.push();
    this.p5.translate(this.x, this.y);
    this.p5.rect(0, 0, this.w, this.h);
    if (!this.hidden) {
      this.p5.textSize(10);
      let t = '"' + this.m.value() + ":" + this.b.value() + ":" + this.s.value() + '",';
      this.p5.text('{ "time" : ' + t, 10, 12);
      this.p5.textSize(9);
      this.p5.text("meas.", 12, 48);
      this.p5.text("beats", 47, 48);
      this.p5.text("16ths", 82, 48);
      this.p5.textSize(11);
      let p = '"' + this.p.value() + '",';
      this.p5.text('"pitch" : ' + p, 125, 12);
      let d = '"' + this.dm.value() + ':' + this.db.value() + ':' + this.ds.value() + '",';
      this.p5.text('"dur" : ' + d, 200, 12);
      this.p5.textSize(9);
      this.p5.text("meas.", 202, 48);
      this.p5.text("beats", 237, 48);
      this.p5.text("16ths", 272, 48);
      this.p5.textSize(11);
      this.p5.text('"vel" : ' + this.v.value() + ' }', 335, 12);
      this.p5.textSize(9);
      this.p5.text("0 - 1", 337, 48);
//      this.p5.text("{", 400, 15);
//      this.p5.text('"time" : "' + t, 410, 15);
//      this.p5.text('"pitch" : ' + p, 410, 25);
//      this.p5.text('"dur" : ', 410, 35);
//      this.p5.text('"vel" : ', 410, 45);
//      this.p5.text("}", 470, 45);
      
    } else {
      this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
      this.p5.text("Shift-click to add a note. Click on a note to edit its properties", this.w/2, this.h/2)
    }
    this.p5.pop();
  }
}

/*
* Note object for sequence. This is the user-created note object (shift-click to add/delete). It gets its initial values from the Cell object shift-clicked.
*/
class Note{
  constructor(_p5, _obj){
    this.p5 = _p5;
    this.time = _obj.time; // m:b:s
    this.pitch = _obj.pitch; // notation "C4"
    this.dur = _obj.dur; // m:b:s
    this.vel = _obj.vel; // 0-1
//    this.degree = _obj.degree; // scale degree **deprecate**
//    this.degree = 0;
    this.x = 0;
    this.y = 0;
    this.noteWidth = 0;
    this.noteHeight = 0;
    this.outline = 1;
  }
  
  display(roll){
    // position the note on the piano roll proportionally
    // use the dimensions of roll (.x, .y, .w, .h)
    // plus the pitch and time scaled proportionally
    // use Tone.Time("0:0:0").toSeconds();
    //let roll_h = roll.h, roll_w = roll.w, roll_x = roll.x, roll_y = roll.y;
    // convert time and duration to seconds and scale note bars
    let roll_l = Tone.Time("4n").toSeconds() * roll.beats;
    let s = Tone.Time(this.time).toSeconds();
    let d = Tone.Time(this.dur).toSeconds(); // note duration in seconds
    this.x = this.p5.map(s, 0, roll_l, roll.x, roll.x + roll.w);
    let rowHeight = roll.h / roll.range;
    this.noteHeight = rowHeight / 2;
    this.noteWidth = this.p5.map(d, 0, roll_l, 0, roll.w); // map length of note in seconds over length of roll in seconds
    let rowNum = roll.pitchSet.indexOf(this.pitch); // get the index of this pitch in the array of rows
    this.y = roll.y + roll.h - rowHeight - (rowNum * rowHeight) + (rowHeight/4);
      //(this.degree * rowHeight) + roll.y + rowHeight/4;
    this.p5.push();
    this.p5.translate(this.x, this.y);
    this.p5.fill(this.vel * 255, 100, 100);
    this.p5.strokeWeight(this.outline);
    this.p5.rect(0, 0, this.noteWidth * 0.95, this.noteHeight);
    this.p5.fill(0);
    //text("dur " + roll_l, 2, 12);
    this.p5.pop();
  }
  
  click(x, y){
    let r = this.x + this.noteWidth;
    let b = this.y + this.noteHeight;
    if(x > this.x && x < r && y > this.y && y < b){
     this.clicked = !this.clicked; 
      return true;
    }  else return false;
  }
  
}

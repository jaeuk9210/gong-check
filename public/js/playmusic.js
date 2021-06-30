let prvious = document.querySelector('#pre');
let play_btn = document.querySelector('#play');
let next = document.querySelector('#next');
let now_time = document.querySelector('#now_time');
let total_time = document.querySelector('#total_time');
let slider = document.querySelector('#duration_slider');

let body = document.querySelector('.container-fluid');
let audio_box = document.querySelector('.audio-container');

body.style.marginBottom = "calc(" + audio_box.offsetHeight + "px + 1rem)";

let timer;

let playing_song = false;
let track = document.querySelector('#review');

function load_track(){
  track.load();
  timer = setInterval(range_slider, 1000);
}

load_track();

function play(){
  if(playing_song == false){
    playsong();
  }else{
    pausesong();
  }
}

function playsong(){
  track.play();
  playing_song = true;
  play_btn.innerHTML = '<span class="material-icons">pause</span>'
}

function pausesong(){
  track.pause();
  playing_song = false;
  play_btn.innerHTML = '<span class="material-icons">play_arrow</span>'
}

function change_duration(){
  slider_position = track.duration * (slider.value / 100);
  track.currentTime = slider_position;
}

function range_slider(){
  let position = 0;

  if(!isNaN(track.duration)){
    let total_min = Math.round(track.duration/60);
    let total_sec = Math.round(track.duration % 60);
    if(total_min < 10) {
      total_min = "0" + total_min;
    }
    if(total_sec < 10) {
      total_sec = "0" + total_sec;
    }

    total_time.innerHTML = total_min + ":" + total_sec;
    position = track.currentTime * (100 / track.duration);
    slider.value = position;
  }

  let now_min = Math.round(track.currentTime/60);
  let now_sec = Math.round(track.currentTime % 60);
  if(now_min < 10) {
    now_min = "0" + now_min;
  }
  if(now_sec < 10) {
    now_sec = "0" + now_sec;
  }
  now_time.innerHTML = now_min + ":" + now_sec;
}

function pre_10s(){
  track.currentTime -= 10;
}

function next_30s(){
  track.currentTime -= 30;
}

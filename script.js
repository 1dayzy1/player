const audios = document.querySelector(".audio");
const play = document.querySelector(".play-btn");
const start = document.querySelector(".start");
const end = document.querySelector(".end");
const length_audio = document.querySelector(".length-audio");
const volume = document.querySelector(".volume");
const upload_audio = document.querySelector("#upload-audio");
const song = document.querySelector(".song");
const artist = document.querySelector(".artist");


const formatTime = (time) => {
  if (isNaN(time)) return "0:00";
  const min = Math.floor(time / 60);
  const sec = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  return `${min}:${sec}`;
};

// const renderAudio = () => {
//   end.textContent = formatTime(audio.duration);
// };

// renderAudio();
volume.addEventListener("input", () => {
  audios.volume = volume.value / 100;
});

// audio.addEventListener("loadedmetadata", renderAudio);

play.addEventListener("click", () => {
  if (play.classList.contains("playing")) {
    audios.pause();
    play.textContent = "▶";
    play.classList.remove("playing");
  } else {
    audios.play();
    play.classList.add("playing");
    play.textContent = "⏸";
  }
});

let db;
const request = indexedDB.open("db", 1);

request.onupgradeneeded = (ev) => {
  db = ev.target.result;

  if (!db.objectStoreNames.contains("audioStore")) {
    const audioStore = db.createObjectStore("audioStore", {
      keyPath: "id",
      autoIncrement: true,
    });
    audioStore.createIndex("title", "title", { unique: false });
  }
};

request.onsuccess = (ev) => {
  db = ev.target.result;
  console.log("База данных открыта или создана");
  loadAudio();
};

request.onerror = (ev) => {
  console.log(`Произошла ошибка открытия: ${ev.target.error}`);
};

upload_audio.addEventListener("change", () => {
  handleAudio(upload_audio);
});

const handleAudio = (audio) => {
  const file = audio.files[0];
  console.log(file);

  if (!file) {
    console.log("Выберите файл");
    audio.value = "";
    return;
  }

  if (!file.type.startsWith("audio/")) {
    console.log("Выберите аудиофайл");
    return;
  }

  console.log("Начинается загрузка", file.name);

  const reader = new FileReader();

  const filename = file.name;
  const [artist, song] = filename
    .replace(".mp3", "") // убираем расширение
    .split("-")
    .map((part) => part.trim());

  console.log(artist, song);

  reader.onload = (ev) => {
    const audioObject = {
      fileName: file.name,
      file: ev.target.result,
      fileSize: file.size,
      song: song,
      artist: artist,
    };
    saveAudio(audioObject);
  };
  reader.onerror = (ev) => {
    console.log(`Не удалось прочитать файл: ${reader.error}`);
    audio.value = "";
  };

  reader.readAsArrayBuffer(file);
};

const saveAudio = (audio) => {
  const transaction = db.transaction(["audioStore"], "readwrite");
  const audioStore = transaction.objectStore("audioStore");
  const addObj = audioStore.add(audio);

  addObj.onsuccess = () => {
    console.log(`файл ${audio.fileName} сохранен`);
    loadAudio()
  };

  addObj.onerror = () => {
    console.log(`файл ${audio.fileName} не получилось сохранить`, addObj.error);
  };
};

const loadAudio = () => {
  try {
    const transaction = db.transaction(["audioStore"], "readonly");
    const audioStore = transaction.objectStore("audioStore");
    const allAuido = audioStore.getAll();

    allAuido.onsuccess = (ev) => {
        result(ev.target.result);
    };

    allAuido.onerror = (ev) => {
      console.log(ev.target.error);
    };
  } catch (error) {
    console.log(error);
  }
};


const renderAudio = (audio) =>{
  console.log(audio)

  if(!audio){
    return;
  }

  const blob = new Blob([audio.file], { type: 'audio/mpeg' });
  // Создаём URL для аудиоэлемента
  const url = URL.createObjectURL(blob);
  audios.src = url;
  artist.textContent = audio.artist;
  song.textContent = audio.song;
  audios.addEventListener("loadedmetadata", () =>{
    const time = formatTime(audios.duration)
    end.textContent = time

  })


}

renderAudio()

const result = (arr_audio) => {
  const playlist = document.querySelector(".playlist");
  arr_audio.forEach((el) => {
    const item = document.createElement("li");
    item.classList.add("song-item");
    
    item.innerHTML = `
              <div>
                <h3>${el.song}</h3>
                <p>${el.artist}</p>
              </div>
              
            `;
    item.addEventListener("click", () =>{
      renderAudio(el);
    })

    playlist.appendChild(item);
  });
};



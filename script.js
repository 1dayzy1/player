const audios = document.querySelector(".audio");
const play = document.querySelector(".play-btn");
const start = document.querySelector(".start");
const end = document.querySelector(".end");
const length_audio = document.querySelector(".length-audio");
const volume = document.querySelector(".volume");
const upload_audio = document.querySelector("#upload-audio");
const song = document.querySelector(".song");
const artist = document.querySelector(".artist");
const playlist = document.querySelector(".playlist");
const prev = document.querySelector(".prev");
const next = document.querySelector(".next");
const btn_more = document.querySelector(".more-track");
const delete_confirmation = document.querySelector(".delete-confirmation");

const track_title = document.querySelector("#track-title");
const track_artist = document.querySelector("#track-artist");

const btn_delete = document.querySelector(".cancel-btn");
const btn_confirm = document.querySelector(".delete-btn");
const delete_modal = document.querySelector(".delete-modal");
let count = 2;

if ("mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("previoustrack", () =>
    switchTrack("prev")
  );
  navigator.mediaSession.setActionHandler("nexttrack", () =>
    switchTrack("next")
  );
  navigator.mediaSession.setActionHandler("play", () => {
    audios.play();
    play.classList.add("playing");
    checkClass();
  });
  navigator.mediaSession.setActionHandler("pause", () => {
    audios.pause();
    play.classList.remove("playing");
    checkClass();
  });
}

const checkClass = () => {
  if (play.classList.contains("playing")) {
    play.textContent = "⏸";
  } else {
    play.textContent = "▶";
  }
};

let currentIndex = 0;
let all_audio = [];

const formatTime = (time) => {
  if (isNaN(time)) return "0:00";
  const min = Math.floor(time / 60);
  const sec = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  return `${min}:${sec}`;
};

audios.src = "";

// const renderAudio = () => {
//   end.textContent = formatTime(audio.duration);
// };

// renderAudio();
volume.addEventListener("input", () => {
  audios.volume = volume.value / 100;
});

// audio.addEventListener("loadedmetadata", renderAudio);

play.addEventListener("click", () => {
  // console.log(audios.src)
  if (!audios.duration) {
    // alert("Выбери песню!")
    return;
  }

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
    loadAudio();
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
      all_audio = ev.target.result;
      result(ev.target.result);
    };

    allAuido.onerror = (ev) => {
      console.log(ev.target.error);
    };
  } catch (error) {
    console.log(error);
  }
};

const renderAudio = (audio) => {
  console.log(audio);

  if (!audio) {
    return;
  }

  length_audio.value = 0;

  end.textContent = "0:00";

  const blob = new Blob([audio.file], { type: "audio/mpeg" });
  // Создаём URL для аудиоэлемента
  const url = URL.createObjectURL(blob);
  audios.src = url;
  artist.textContent = audio.artist;
  song.textContent = audio.song;
  audios.addEventListener("loadedmetadata", () => {
    const time = formatTime(audios.duration);
    end.textContent = time;
  });

  audios.play();
  play.classList.add("playing");
  checkClass();
};

renderAudio();

const deleteItem = (item) => {
  try {
    console.log(item);

    track_title.textContent = item.song;
    track_artist.textContent = item.artist;
    delete_confirmation.classList.remove("hidden");

    btn_delete.addEventListener("click", () => {
      delete_confirmation.classList.add("hidden");
    });

    btn_confirm.addEventListener("click", () => {
      const transaction = db.transaction(["audioStore"], "readwrite");
      const audioStore = transaction.objectStore("audioStore");
      const deleteAudio = audioStore.delete(item.id);

      deleteAudio.onsuccess = (ev) => {
        delete_modal.classList.add("active");
        setTimeout(() => {
          delete_confirmation.classList.add("hidden");
          delete_modal.classList.remove("active");
        }, 2000);
        loadAudio();
      };

      deleteAudio.onerror = (ev) => {
        console.log(ev.target.error);
      };
    });
  } catch (error) {
    console.log(error);
  }
};

const result = (arr_audio) => {
  playlist.textContent = "";

  arr_audio.slice(0, count).forEach((el) => {
    const item = document.createElement("li");
    item.classList.add("song-item");

    item.innerHTML = `
              <div>
                <h3>${el.song}</h3>
                <p>${el.artist}</p>
              </div>

              <span class="delete">🗑️</span>
              
            `;

    item.querySelector(".delete").addEventListener("click", (e) => {
      e.stopPropagation();

      deleteItem(el);
    });
    item.addEventListener("click", () => {
      renderAudio(el);
    });

    playlist.appendChild(item);
  });
};

const switchTrack = (type) => {
  audios.pause();

  if (type === "prev") {
    currentIndex = (currentIndex - 1 + all_audio.length) % all_audio.length;
  } else if (type === "next") {
    currentIndex = (currentIndex + 1) % all_audio.length;
  }

  const nextTrack = all_audio[currentIndex];

  if (nextTrack) {
    renderAudio(nextTrack);

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: nextTrack.song || "Неизвестный трек",
        artist: nextTrack.artist || "Неизвестный артист",
      });
    }
    // audios.play();
  }
};

prev.addEventListener("click", () => {
  switchTrack("prev");
});

next.addEventListener("click", () => {
  switchTrack("next");
});

audios.addEventListener("timeupdate", () => {
  start.textContent = formatTime(audios.currentTime);

  if (audios.duration) {
    const progres = (audios.currentTime / audios.duration) * 100;
    length_audio.value = progres;
  }
});

length_audio.addEventListener("input", (e) => {
  if (audios.duration) {
    const newTime = (e.target.value / 100) * audios.duration;
    audios.currentTime = newTime;
  }
});

audios.addEventListener("ended", () => {
  switchTrack("next");
});

btn_more.addEventListener("click", () => {
  count += +2;

  result(all_audio);

  console.log(count);
});

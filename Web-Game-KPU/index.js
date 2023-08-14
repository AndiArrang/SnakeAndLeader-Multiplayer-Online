const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');

// server game
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = 3000;


// mengambil data pertanyaan dari file
const jsonData = fs.readFileSync('data.json', 'utf8');
const pertanyaan = JSON.parse(jsonData);

// Mengacak urutan pertanyaan
pertanyaan.sort(() => Math.random() - 0.5);

// Menyimpan urutan pemain
let turn = 0;

//fungsi pilih karakter otomatis
const availableCharacters = ['singa', 'kuda', 'gajah', 'harimau'];

function pilihChar(socketId,room) {
  // Cari karakter pertama yang belum dipilih
  const char = availableCharacters.find(character => !rooms[room].chosenCharacters.includes(character));
  io.to(socketId).emit('charTerpilih',(char))
  return char;
}


// Fungsi untuk mengirim pertanyaan ke pemain
function kirimPertanyaan(socketId) {
  const indexPertanyaan = turn % pertanyaan.length;
  const pertanyaanData = pertanyaan[indexPertanyaan];
  const room = Object.values(rooms).find((room) =>
  room.listPlayers.some((player) => player.id === socketId)
  );

  const player = room.listPlayers.filter((player) => player.id === socketId);

  io.emit('tanda-turn',(player[0].char))
  io.to(socketId).emit('pertanyaan', pertanyaanData.pertanyaan);
}

const rooms = {
  room1: {
    nama: 'room1',
    listPlayers: [],
    chosenCharacters: [],
    gameStarted: false
  },
  room2: {
    nama: 'room2',
    listPlayers: [],
    chosenCharacters: [],
    gameStarted: false
  },
  room3: {
    nama: 'room3',
    listPlayers: [],
    chosenCharacters: [],
    gameStarted: false
  },
  room4: {
    nama: 'room4',
    listPlayers: [],
    chosenCharacters: [],
    gameStarted: false
  },
  room5: {
    nama: 'room5',
    listPlayers: [],
    chosenCharacters: [],
    gameStarted: false
  }
};

io.on('connection', (socket) => {
  console.log('Pemain baru terhubung');
  console.log(socket.id)
  socket.emit('daftarRoom',(rooms))

  // Menambahkan pemain baru ke room yang tersedia atau membuat room baru
  socket.on('joinRoom', (data) => {
    console.log(data)
    //cek apakah kapsitas room masih tersedia
    if (rooms[data.room].listPlayers.length < 4 && rooms[data.room].gameStarted == false) {
      const char = pilihChar(socket.id,data.room)
      rooms[data.room].listPlayers.push({
        id: socket.id,
        nama: data.playerName, 
        position: 1,
        char
      });
      rooms[data.room].chosenCharacters.push(char)
      socket.join(data.room)
      const alert = `${data.playerName} telah bergabung di room ${data.room}`;
      socket.broadcast.to(data.room).emit('notifRoom',(alert))
      io.to(data.room).emit('pageRoom',(data.room))
      io.to(socket.id).emit('createArena',(rooms))
      io.to(data.room).emit('playerInRoom',(rooms[data.room].listPlayers))

    } else if (rooms[data.room].gameStarted === true) {
      const alert = 'Permainan telah dimulai'
      socket.emit('notifLoby',(alert))
    }else {
      const alert = 'Room telah penuh silahkan cari room lain'
      socket.emit('notifLoby',(alert))
    }

  });

  // event mulai game
  socket.on('startGame',() => {
    turn = 0;
    const room = Object.values(rooms).find((room) =>
          room.listPlayers.some((player) => player.id === socket.id)
    );
    room.gameStarted = true;
    kirimPertanyaan(room.listPlayers[0].id)
    io.to(room.nama).emit('btn-action',(true))
  })

  // event reset game
  socket.on('resetGame', () => {
    const room = Object.values(rooms).find((room) =>
          room.listPlayers.some((player) => player.id === socket.id)
    );
    room.gameStarted = false;
    room.listPlayers.map((player) => {
      console.log('resetGame')
      player.position = 1;
      io.to(room.nama).emit('reset-game',(player))
    })

    io.to(room.nama).emit('btn-action',(false))
  })

  socket.on('jawaban', (jawaban) => {
        
        const indexPertanyaan = turn % pertanyaan.length;
        const pertanyaanData = pertanyaan[indexPertanyaan];
        const room = Object.values(rooms).find((room) =>
          room.listPlayers.some((player) => player.id === socket.id)
        );
        io.to(room.nama).emit('remove-turn')
        // const player = room.listPlayers.filter((player) => player.id === socket.id);
    
        if (jawaban.toLowerCase() === pertanyaanData.jawaban.toLowerCase()) {

          io.to(socket.id).emit('answer', ('benar')); 
        } else {
          
          io.to(socket.id).emit('answer', ('salah'));
        }
    
        turn++;
        // Mengirim pertanyaan ke pemain selanjutnya
        const nextPlayerId = Object.keys(room.listPlayers)[turn % Object.keys(room.listPlayers).length];
        console.log(room.listPlayers[nextPlayerId].id)
        kirimPertanyaan(room.listPlayers[nextPlayerId].id);
  });

  // menerima hasil roll dadu
    socket.on('hasilDadu',(hasil) => {
    
    const room = Object.values(rooms).find((room) =>
      room.listPlayers.some((player) => player.id === socket.id)
    );
    const player = room.listPlayers.filter((player) => player.id === socket.id);
    const fp =  player[0].position;
    player[0].position = player[0].position + hasil;
    io.to(room.nama).emit('playerMoved',player[0],fp)
    })

  // handle ketika pemain berada di ular atau tangga
  socket.on('snake-leader',(posisi,char,action) => {
    const room = Object.values(rooms).find((room) =>
    room.listPlayers.some((player) => player.id === socket.id)
    );
    const player = room.listPlayers.filter((player) => player.char === char);
    if (action === 'leader') {
      player[0].position = posisi;
      io.to(socket.id).emit('handle-snake-leader',player[0],'leader');
    } else {
      player[0].position = posisi;
      io.to(socket.id).emit('handle-snake-leader',player[0],'snake');
    }
  })

  // handle ketika permainan selesai / sudah ada pemenang
  socket.on('game-selesai',() => {
    const room = Object.values(rooms).find((room) =>
    room.listPlayers.some((player) => player.id === socket.id)
    );
    const player = room.listPlayers.find((pemain) => {
      return pemain.id === socket.id;
    })
    if (player.position >= 100) {
      io.to(socket.id).emit('winner')
    } else {
      io.to(socket.id).emit('loser')
    }
  })

  // Menghandle pemain keluar
  socket.on('leaveRoom', () => {
    console.log('dissconnet')

    // Mencari room yang pemain tinggalkan
    const room = Object.values(rooms).find((room) =>
      room.listPlayers.some((player) => player.id === socket.id)
    ); 

    if (room) {
      // Menghapus pemain dari room
      socket.leave(room.nama)
      const playerLeave = room.listPlayers.filter((player) => player.id == socket.id);
      room.listPlayers = room.listPlayers.filter((player) => player.id !== socket.id);
      console.log(`${socket.id} meninggalkan ${room.nama}`);
      console.log(playerLeave)
      room.chosenCharacters = room.chosenCharacters.filter((char) => char !== playerLeave[0].char)
      console.log(room.chosenCharacters)

      // Mengirim info pemain terbaru ke semua pemain yang terhubung di room tersebut
      socket.broadcast.to(room.nama).emit('playerInRoom', (room.listPlayers));
      socket.broadcast.to(room.nama).emit('handlePlayerLeave', (playerLeave));
      io.to(socket.id).emit('daftarRoom', (rooms))

       // menghentikan permainan ketika tidak ada player di room
       if (room.listPlayers.length < 1 ) {
        room.gameStarted = false;
      }

    }
  });


  socket.on('disconnect',() => {
    console.log('dissconnet')
    // Mencari room yang pemain tinggalkan
    const room = Object.values(rooms).find((room) =>
      room.listPlayers.some((player) => player.id === socket.id)
    ); 

    if (room) {
      // Menghapus pemain dari room
      const playerLeave = room.listPlayers.filter((player) => player.id == socket.id);
      room.listPlayers = room.listPlayers.filter((player) => player.id !== socket.id);
      console.log(`${socket.id} meninggalkan ${room.nama}`);
      console.log(playerLeave)
      room.chosenCharacters = room.chosenCharacters.filter((char) => char !== playerLeave[0].char)
      console.log(room.chosenCharacters)

      // Mengirim info pemain terbaru ke semua pemain yang terhubung di room tersebut
      io.to(room.nama).emit('playerInRoom', (room.listPlayers));
      io.to(room.nama).emit('handlePlayerLeave', (playerLeave));
      io.to(socket.id).emit('daftarRoom', (rooms))

      // menghentikan permainan ketika tidak ada player di room
      if (room.listPlayers.length < 1 ) {
        room.gameStarted = false;
      }
    }
  })
});




// Mengatur folder publik sebagai folder statis
app.use(express.static('public'));

// Menjalankan server
server.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});





//catatan 
// bagaiamana membuat halaman khusus room
// tampilkan pemain yg berada di room
// perbaiki arena
// perbaiki aturan giliran pemain
// jgn pakai prompt
// tampilkan pertanyaan ke semuan pemain tapi hanya pemain yg dapat giliran yg bisa jawab
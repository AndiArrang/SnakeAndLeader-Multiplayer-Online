
    const socket = io();
    const containerRoom = document.querySelector('.container-room')
    const containerLoby = document.querySelector('.container-loby')
    const roomsContainer = document.getElementById('rooms')
    const btnCreateRoom = document.getElementById('btn-createRoom')
    const namaRoom = document.querySelector('.nama-room')
    const playersContainer = document.getElementById('players');
    const gameBoard = document.getElementById('gameBoard');
    const questionText = document.getElementById('questionText');
    const answerInput = document.getElementById('answerInput');
    const answerButton = document.getElementById('answerButton');
    const btnLeave = document.getElementById('btn-leave')
    const btnStartGame = document.getElementById('btn-mulaiGame')
    const btnResetGame = document.getElementById('btn-resetGame')
    const notif = document.getElementById('alert-container');
    const alertAnswer = document.getElementById('alert-answer');
    const elDiceOne = document.getElementById('dice1');

    answerButton.hidden = true;
    answerInput.hidden = true;
    notif.hidden = true;

// fungsi untuk roll dadu
    function rollDice() { 
      const sound = document.getElementById('sound-dadu');
      const diceOne = Math.floor((Math.random() * 6) + 1);
      sound.play();
      
      function rollAnimation() {
        for (var i = 1; i <= 6; i++) {
          elDiceOne.classList.remove('show-' + i);
          if (diceOne  === i ) {
           elDiceOne.classList.add('show-' + i);       
          }
        }
      }
      rollAnimation()

      setTimeout(() => {
        socket.emit('hasilDadu',(diceOne))
      }, 1000);


    }

    // fungsi handle ketika berada pada ular atau tangga
    const snakeLeader = (posisi,char) => {
      switch (posisi) {
        case 4:
          socket.emit('snake-leader',14,char,'leader')
          break;
        case 9:
          socket.emit('snake-leader',31,char,'leader')
          break;
        case 17:
          socket.emit('snake-leader',7,char,'snake')
          break;
        case 21:
          socket.emit('snake-leader',42,char,'leader')
          break;
        case 28:
          socket.emit('snake-leader',84,char,'leader')
          break;
        case 51:
          socket.emit('snake-leader',67,char,'leader')
          break;
        case 54:
          socket.emit('snake-leader',34,char,'snake')
          break;
        case 62:
          socket.emit('snake-leader',19,char,'snake')
          break;
        case 72:
          socket.emit('snake-leader',91,char,'leader')
          break;
        case 80:
          socket.emit('snake-leader',99,char,'leader')
          break;
        case 87:
          socket.emit('snake-leader',36,char,'snake')
          break;
        case 95:
          socket.emit('snake-leader',75,char,'snake')
          break;
        case 98:
          socket.emit('snake-leader',79,char,'snake')
          break;
      } 
    }
  
    const showAlert = (pesan) => {
      notif.hidden = false;
      notif.innerHTML = pesan;
      setTimeout(function() {
        // Menghilangkan alert setelah 2 detik
        notif.hidden = true
      }, 2000);
    }

    // function join room
    const joinRoom = (data) => {
       socket.emit('joinRoom',(data))  
    }

    const showAlertRoom = (pesan) => {
      alertAnswer.innerHTML = pesan;
      setTimeout(function() {
        // Menghilangkan alert setelah 2 detik
        alertAnswer.innerHTML = ''
      }, 2000);
    }

    const leaveRoom = () => {
      socket.emit('leaveRoom');
      gameBoard.innerHTML = '';
      btnStartGame.hidden = false;
        btnResetGame.hidden = true;
        answerButton.hidden = true;
        answerInput.hidden = true;  
        questionText.hidden = true;
    }

    const startGame = () => {
      socket.emit('startGame')
    }

    const resetGame = () => {
      socket.emit('resetGame')
      const element = document.querySelector('.active');
      element.classList.remove('active'); 
    }

    socket.on('btn-action',(action) => {
      if (action) {
        btnStartGame.hidden = true;
        btnResetGame.hidden = false
      } else {
        btnStartGame.hidden = false;
        btnResetGame.hidden = true;
        answerButton.hidden = true;
        answerInput.hidden = true;  
        questionText.hidden = true;
      }
    })

    // menampilkan daftar room pada loby
    socket.on('daftarRoom',(rooms) => {
      containerRoom.hidden = true;
      containerLoby.hidden = false;
      console.log(Object.keys(rooms).length)
      if(Object.keys(rooms).length > 0) {
        roomsContainer.innerHTML = '<h2>Daftar Room :</h2>'
        Object.keys(rooms).forEach((room,i) => { 
        const roomElement = document.createElement('div');
        roomElement.classList.add('room-card')
        roomElement.textContent = room;
        roomsContainer.appendChild(roomElement);
        roomElement.addEventListener('click', () => {
          var myModal = new bootstrap.Modal(document.getElementById("form-nama"));
          myModal.show();
            document.getElementById('btn-submit').onclick = function() {
            const nama = document.getElementById('nama-player')
            const data = {
              playerName: nama.value,
              room
            }
              joinRoom(data);
          };
        });
        })
      }else{
        roomsContainer.innerHTML = '<h2> Tidak Ada Room Tersedia </h2>'
      } 
    })

    // noftifikasi dari room
    socket.on('notifRoom',(notif) => {
      showAlertRoom(`<div class="alert alert-info alert-jawaban" role="alert">
      ${notif}
       </div>`)
    })
    // noftifikasi dari loby
    socket.on('notifLoby',(notif) => {
        showAlert(notif)
    }) 
    
   socket.on('charTerpilih',(char) => {
      showAlertRoom(`<div class="alert alert-info alert-jawaban" role="alert">
      Karakter anda adalah ${char}
       </div>`)
   }) 

   // menampilkan halaman room
    socket.on('pageRoom', (nama) => {
      namaRoom.innerHTML = `<h4> Room : ${nama} </h4>`;
      btnResetGame.hidden = true;
      containerRoom.hidden = false;
      containerLoby.hidden = true;
    })  

    // event ketika player meninggalkan room
    socket.on('handlePlayerLeave',(player) => {
      showAlertRoom(`<div class="alert alert-info alert-jawaban" role="alert">
      ${player[0].nama} meninggalkan room
       </div>`)
      const playerChar = document.querySelector(`.${player[0].char}`)
      if (playerChar) {
        playerChar.remove()
      }
    })

    // menampilkan player dalam room beserta karakternya
    socket.on('playerInRoom',(players) => {
      console.log(players)
      playersContainer.innerHTML =`<h5 class="title-container-player">Pemain:</h5>`
        players.forEach((player) => {
          // menempatkan posisi char pemain
          const start = document.querySelector('.cell-1');
          
          const cekDuplikat = document.querySelector(`.${player.char}`)

          if (cekDuplikat === null) {
            const character = document.createElement('div');
            character.classList.add(player.char);
            start.appendChild(character)
          }

          const playerElement = document.createElement('div');
          playerElement.classList.add(`p-${player.char}`)    
          playerElement.textContent = player.nama;
          playersContainer.appendChild(playerElement);
        })
    })

    // membuat efek cahaya pada nama pemain yg dapat giliran
    socket.on('tanda-turn',(char) => {
      document.querySelector(`.p-${char}`).classList.add('active');
    })
    socket.on('remove-turn',() => {
      const element = document.querySelector('.active');
      element.classList.remove('active'); 
    })

    // Menerima pertanyaan dari server
    socket.on('pertanyaan', (pertanyaan) => {

      questionText.hidden = false;
      questionText.textContent = pertanyaan;
      answerButton.hidden = false;
      answerInput.hidden = false;
      answerInput.value = '';
      answerInput.focus();
      answerButton.disabled = false;
    });

    // Mengirim jawaban ke server
    answerButton.addEventListener('click', () => {
      const jawaban = answerInput.value.trim();
      if (jawaban !== '') {
        socket.emit('jawaban', jawaban);
        questionText.hidden = true;
        answerButton.hidden = true;
        answerInput.hidden = true; 
      }
    });

    // event ketika pemain bergerak
    socket.on('playerMoved', (player,fp) => {
        console.log(player)
    
        function loopWithDelay(i) {

          if (i < player.position) {

            const sound = document.getElementById('sound-moved');
            const posisiKarakterSaatIni = document.querySelector(`.${player.char}`);
            posisiKarakterSaatIni.classList.add('efek-move')
            setTimeout(() => {
              posisiKarakterSaatIni.remove();
              sound.play();
            },200)
   
            setTimeout(function() {
              // sound.pause();
              const character = document.createElement('div');
              character.classList.add(player.char);
              const posisi = document.querySelector(`.cell-${i+1}`);
              posisi.appendChild(character)
                if ((i+1) < 100) {
                  loopWithDelay(i + 1);
                } else {
                  socket.emit('game-selesai')
                }
              }, 500);

          } else {
            snakeLeader(player.position,player.char)
          }
        }
        
        loopWithDelay(fp);
      });
    
    // event ketika permainan selesai

    socket.on('winner',() => {
      const sound = document.getElementById('sound-winner');
      sound.play();
      document.querySelector('.modal-body').textContent = 'Selamat Anda Memenangkan Permainan !!!'
      var myModal = new bootstrap.Modal(document.getElementById("exampleModal"));
      myModal.show();
    })

    socket.on('loser',() => {
      const sound = document.getElementById('sound-loser');
      sound.play();
      document.querySelector('.modal-body').textContent = 'Yahh,,, Anda Kalah, Tetap Semangat !!!'
      var myModal = new bootstrap.Modal(document.getElementById("exampleModal"));
      myModal.show();
    })


    // event ketika pemain terkena tangga atau ular
      socket.on('handle-snake-leader',(player,action) => {
        console.log(action) 
        if (action === 'snake'){
          console.log('buggg')
           sound = document.getElementById('sound-snake');
           sound.play()
        } else {
          console.log('yaya')
          sound = document.getElementById('sound-leader');
          sound.play()
        }
        const posisiKarakterSaatIni = document.querySelector(`.${player.char}`);
        posisiKarakterSaatIni.remove();
        
          setTimeout(() => {
            const character = document.createElement('div');
            character.classList.add(player.char);
            const posisi = document.querySelector(`.cell-${player.position}`);
            posisi.appendChild(character)
          }, 700);
      })


    // event ketika game direset
    socket.on('reset-game',(player) => {
      const posisiKarakterSaatIni = document.querySelector(`.${player.char}`);
      posisiKarakterSaatIni.remove();

      const character = document.createElement('div');
      character.classList.add(player.char);
      const posisi = document.querySelector(`.cell-${player.position}`);
      posisi.appendChild(character)
    })

    // Menerima status jawaban salah dari server
    socket.on('answer', (jawaban) => {
      if (jawaban == 'benar') {
        showAlertRoom(`<div class="alert alert-success alert-jawaban" role="alert">
        Jawaban anda benar
         </div>`);
        rollDice();
      } else {
        showAlertRoom(`<div class="alert alert-danger alert-jawaban" role="alert">
        Jawaban anda salah
         </div>`)
      }
      
    });
  
  socket.on('createArena',(rooms) => {
    
   console.log(rooms)
   if(gameBoard.innerHTML == '') {
    for (let i = 0; i < 10; i++) {
      const row = document.createElement('tr');
      
      if ( i % 2 === 0) {
        for (let j = 0; j < 10; j++) {
          const index = 100 - (i * 10 + j);
          const cell = document.createElement('td');
          cell.classList.add(`cell-${index}`);
          // cell.textContent = index;
          row.appendChild(cell);
        }
      } else {
        for (let j = 10; j > 0; j--) {
          const index = 100 - (i * 10 + j - 1); 
          const cell = document.createElement('td');
          cell.classList.add(`cell-${index}`);
          // cell.textContent = index;
          row.appendChild(cell);
        }
      }
      
      gameBoard.appendChild(row);
    }
   }
  })

  
       
 

      


 
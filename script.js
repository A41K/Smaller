 // DOM elements
    const recordPlayer = document.getElementById('recordPlayer');
    const vinylSelector = document.getElementById('vinylSelector');
    const activeRecord = document.getElementById('activeRecord');
    const recordLabel = document.getElementById('recordLabel');
    const playerArm = document.getElementById('playerArm');
    const playingIndicator = document.getElementById('playingIndicator');
    const playPauseButton = document.getElementById('playPauseButton');
    const stopButton = document.getElementById('stopButton');
    const nextButton = document.getElementById('nextButton');
    const volumeControl = document.getElementById('volumeControl');
    const colorOptions = document.querySelectorAll('.color-option');
    const nowPlaying = document.getElementById('nowPlaying');
    const currentTrack = document.getElementById('currentTrack');
    const fileUpload = document.getElementById('fileUpload');
    const imageUpload = document.getElementById('imageUpload');
    const progressBar = document.getElementById('progressBar');
    const currentTimeDisplay = document.getElementById('currentTime');
    const totalTimeDisplay = document.getElementById('totalTime');
    
    // Audio setup
    let currentSong = null;
    let isPlaying = false;
    let currentVinylIndex = -1;
    let songs = [];
    let progressInterval;
    let lastUploadedImage = null;
    
    // Default album images (placeholder URLs - in a real application, you would use actual images)
    const defaultAlbumImages = [
        "DAMN.png", // Using placeholder images as examples
        "/api/placeholder/100/100",
        "/api/placeholder/100/100",
        "/api/placeholder/100/100",
        "/api/placeholder/100/100"
    ];
    
    // Initialize with demo tracks
    const demoTracks = [
        {
            title: "BLOOD.",
            artist: "Kendrick Lamar",
            image: defaultAlbumImages[0],
            url: "DAMN/BLOOD.mp3"
        },
        {
            title: "DNA.",
            artist: "Kendrick Lamar",
            image: defaultAlbumImages[0],
            url: "DAMN/DNA.mp3"
        },
        {
            title: "DUCKWORTH.",
            artist: "Kendrick Lamar",
            image: defaultAlbumImages[0],
            url: "DAMN/DUCKWORTH.mp3"
        },
        {
            title: "ELEMENT.",
            artist: "Kendrick Lamar",
            image: defaultAlbumImages[0],
            url: "DAMN/ELEMENT.mp3"
        },
        {
            title: "FEAR.",
            artist: "Kendrick Lamar",
            image: defaultAlbumImages[0],
            url: "DAMN/FEAR.mp3"
        },
        {
            title: "FEEL.",
            artist: "Kendrick Lamar",
            image: defaultAlbumImages[0],
            url: "DAMN/FEEL.mp3"
        },
        {
            title: "GOD.",
            artist: "Kendrick Lamar",
            image: defaultAlbumImages[0],
            url: "DAMN/GOD.mp3"
        },
        {
            title: "HUMBLE.",
            artist: "Kendrick Lamar",
            image: defaultAlbumImages[0],
            url: "DAMN/HUMBLE.mp3"
        },
        {
            title: "LOVE.",
            artist: "Kendrick Lamar",
            image: defaultAlbumImages[0],
            url: "DAMN/LOVE.mp3"
        },
        {
            title: "LOYALTY.",
            artist: "Kendrick Lamar",
            image: defaultAlbumImages[0],
            url: "DAMN/LOYALTY.mp3"
        },
        {
            title: "LUST.",
            artist: "Kendrick Lamar",
            image: defaultAlbumImages[0],
            url: "DAMN/LUST.mp3"
        },
        {
            title: "PRIDE.",
            artist: "Kendrick Lamar",
            image: defaultAlbumImages[0],
            url: "DAMN/PRIDE.mp3"
        },
        {
            title: "XXX.",
            artist: "Kendrick Lamar",
            image: defaultAlbumImages[0],
            url: "DAMN/XXX.mp3"
        },
        {
            title: "YAH.",
            artist: "Kendrick Lamar",
            image: defaultAlbumImages[0],
            url: "DAMN/YAH.mp3"
        },
    ];
    
    // Initialize songs with demo tracks
    initializeDemoTracks();
    
    // File upload handling
    fileUpload.addEventListener('change', handleFileUpload);
    imageUpload.addEventListener('change', handleImageUpload);
    
    // Toggle vinyl selector
    recordPlayer.addEventListener('click', function() {
        if (vinylSelector.style.display === 'block') {
            vinylSelector.style.display = 'none';
        } else {
            vinylSelector.style.display = 'block';
        }
    });
    
    // Play/Pause button
    playPauseButton.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent triggering the record player click
        
        if (currentVinylIndex === -1) {
            // No vinyl selected
            alert('Please select a track first!');
            vinylSelector.style.display = 'block';
            return;
        }
        
        if (isPlaying) {
            pausePlayback();
        } else {
            startPlayback();
        }
    });
    
    // Stop button
    stopButton.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent triggering the record player click
        stopPlayback();
    });
    
    // Next button
    nextButton.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent triggering the record player click
        playNextSong();
    });
    
    // Volume control
    volumeControl.addEventListener('input', function() {
        if (currentSong) {
            currentSong.volume(this.value);
        }
    });
    
    // Color options for record player
    colorOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent opening the vinyl selector
            
            // Update selected state
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            // Change record player color
            const color = this.getAttribute('data-color');
            recordPlayer.style.backgroundColor = color;
        });
    });
    
    // Initialize demo tracks
    function initializeDemoTracks() {
        songs = [];
        vinylSelector.innerHTML = ''; // Clear existing items
        
        demoTracks.forEach((track, index) => {
            // Create Howl instance for the track
            const sound = new Howl({
                src: [track.url],
                html5: true,
                onplay: function() {
                    startProgressUpdate();
                },
                onpause: function() {
                    clearInterval(progressInterval);
                },
                onstop: function() {
                    clearInterval(progressInterval);
                    resetProgress();
                },
                onend: function() {
                    clearInterval(progressInterval);
                    resetProgress();
                    playNextSong();
                },
                onload: function() {
                    // Update total time display when loaded
                    if (currentVinylIndex === index) {
                        updateTotalTime();
                    }
                }
            });
            
            // Add to songs array
            songs.push({
                sound: sound,
                title: track.title,
                artist: track.artist,
                image: track.image
            });
            
            // Create vinyl item in selector
            addVinylItemToSelector(track.title, track.artist, track.image, index);
        });
    }
    
    // Handle file upload
    function handleFileUpload(event) {
        const files = event.target.files;
        if (!files.length) return;
        
        // Process each file
        Array.from(files).forEach(file => {
            // Create object URL for the file
            const objectURL = URL.createObjectURL(file);
            
            // Extract file name (will be used as title)
            const title = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
            
            // Pick a random image for this track or use the last uploaded one
            const albumImage = lastUploadedImage || defaultAlbumImages[Math.floor(Math.random() * defaultAlbumImages.length)];
            
            // Create Howl instance for the track
            const sound = new Howl({
                src: [objectURL],
                html5: true,
                onplay: function() {
                    startProgressUpdate();
                },
                onpause: function() {
                    clearInterval(progressInterval);
                },
                onstop: function() {
                    clearInterval(progressInterval);
                    resetProgress();
                },
                onend: function() {
                    clearInterval(progressInterval);
                    resetProgress();
                    playNextSong();
                },
                onload: function() {
                    // Update total time display when loaded
                    if (currentVinylIndex === songs.length - 1) {
                        updateTotalTime();
                    }
                }
            });
            
            // Add to songs array
            songs.push({
                sound: sound,
                title: title,
                artist: "Unknown Artist",
                image: albumImage
            });
            
            // Create vinyl item in selector
            const index = songs.length - 1;
            addVinylItemToSelector(title, "Unknown Artist", albumImage, index);
        });
        
        // Clear the file input to allow uploading the same file again
        fileUpload.value = '';
        
        // Display the vinyl selector
        vinylSelector.style.display = 'block';
    }
    
    // Handle image upload
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Create object URL for the image
        const imageURL = URL.createObjectURL(file);
        
        // Store the last uploaded image
        lastUploadedImage = imageURL;
        
        // Alert the user
        alert("Image uploaded successfully! It will be used for the next audio file you upload.");
        
        // Clear the file input to allow uploading the same image again
        imageUpload.value = '';
    }
    
    // Add vinyl item to selector
    function addVinylItemToSelector(title, artist, image, index) {
        const vinylItem = document.createElement('div');
        vinylItem.className = 'vinyl-item';
        vinylItem.setAttribute('data-song', index);
        
        vinylItem.innerHTML = `
            <div class="vinyl-image" style="background-image: url('${image}');"></div>
            <div class="vinyl-details">
                <div class="vinyl-title">${title}</div>
                <div class="vinyl-artist">${artist}</div>
            </div>
        `;
        
        vinylItem.addEventListener('click', function() {
            selectVinyl(index);
            vinylSelector.style.display = 'none';
        });
        
        vinylSelector.appendChild(vinylItem);
    }
    
    // Select vinyl
    function selectVinyl(index) {
        // Stop current playback
        stopPlayback();
        
        // Set the new index
        currentVinylIndex = index;
        
        // Update visuals
        activeRecord.classList.add('active');
        recordLabel.style.backgroundImage = `url('${songs[index].image}')`;
        
        // Update now playing text
        currentTrack.textContent = `${songs[index].title} - ${songs[index].artist}`;
        
        // Prepare the song
        currentSong = songs[index].sound;
        
        // Update total time
        updateTotalTime();
        
        // Auto-play the vinyl
        startPlayback();
    }
    
    function startPlayback() {
        if (!currentSong || currentVinylIndex === -1) return;
        
        // Visual updates
        activeRecord.classList.add('spinning');
        playerArm.style.transform = 'rotate(0deg)';
        playingIndicator.classList.add('active');
        playPauseButton.textContent = '⏸️';
        nowPlaying.classList.add('active');
        
        // Set volume
        currentSong.volume(volumeControl.value);
        
        // Start playback
        currentSong.play();
        isPlaying = true;
    }
    
    function pausePlayback() {
        if (!currentSong) return;
        
        // Visual updates
        activeRecord.classList.remove('spinning');
        playingIndicator.classList.remove('active');
        playPauseButton.textContent = '▶️';
        
        // Pause the audio
        currentSong.pause();
        isPlaying = false;
    }
    
    function stopPlayback() {
        if (!currentSong) return;
        
        // Visual updates
        activeRecord.classList.remove('spinning');
        playerArm.style.transform = 'rotate(-45deg)';
        playingIndicator.classList.remove('active');
        playPauseButton.textContent = '▶️';
        nowPlaying.classList.remove('active');
        
        // Stop the audio
        currentSong.stop();
        isPlaying = false;
    }
    
    function playNextSong() {
        if (currentVinylIndex === -1 || songs.length === 0) return;
        
        const nextIndex = (currentVinylIndex + 1) % songs.length;
        selectVinyl(nextIndex);
    }
    
    // Progress bar and time updates
    function startProgressUpdate() {
        clearInterval(progressInterval);
        
        progressInterval = setInterval(() => {
            if (currentSong && isPlaying) {
                const currentTime = currentSong.seek();
                const duration = currentSong.duration();
                
                if (duration > 0) {
                    // Update progress bar
                    const percentage = (currentTime / duration) * 100;
                    progressBar.style.width = `${percentage}%`;
                    
                    // Update time display
                    currentTimeDisplay.textContent = formatTime(currentTime);
                }
            }
        }, 100);
    }
    
    function resetProgress() {
        progressBar.style.width = '0%';
        currentTimeDisplay.textContent = '0:00';
    }
    
    function updateTotalTime() {
        if (currentSong) {
            const duration = currentSong.duration();
            totalTimeDisplay.textContent = formatTime(duration);
        }
    }
    
    function formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
    }

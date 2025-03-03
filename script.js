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
let needleMovementTimeout = null;
let db = null;

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

// Initialize IndexedDB and load songs
initializeDatabase().then(() => {
    // Initialize the app once the database is ready
    initializeApp();
});

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
    // Save volume setting to IndexedDB
    saveSettings({ volume: this.value });
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
        
        // Save color preference to IndexedDB
        saveSettings({ playerColor: color });
    });
});

// Initialize IndexedDB
async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('VinylPlayerDB', 1);
        
        request.onerror = function(event) {
            console.error('IndexedDB error:', event.target.error);
            reject(event.target.error);
        };
        
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            
            // Create object stores if they don't exist
            if (!db.objectStoreNames.contains('tracks')) {
                db.createObjectStore('tracks', { keyPath: 'id', autoIncrement: true });
            }
            
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains('albumArt')) {
                db.createObjectStore('albumArt', { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains('audioFiles')) {
                db.createObjectStore('audioFiles', { keyPath: 'id' });
            }
        };
        
        request.onsuccess = function(event) {
            db = event.target.result;
            console.log('IndexedDB initialized successfully');
            resolve();
        };
    });
}

// Initialize the application
async function initializeApp() {
    // Load saved player settings
    await loadSettings();
    
    // Load custom album art
    await loadAlbumArt();
    
    // Initialize demo tracks and load user tracks
    songs = [];
    vinylSelector.innerHTML = '';
    loadDemoTracks();
    await loadUserTracks();
}

// Save settings to IndexedDB
function saveSettings(settingsObj) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        
        // Merge with existing settings
        const getRequest = store.get(1);
        
        getRequest.onsuccess = function(event) {
            let currentSettings = event.target.result || { id: 1 };
            const updatedSettings = { ...currentSettings, ...settingsObj };
            
            const putRequest = store.put(updatedSettings);
            
            putRequest.onsuccess = function() {
                resolve();
            };
            
            putRequest.onerror = function(e) {
                reject(e.target.error);
            };
        };
        
        getRequest.onerror = function(e) {
            reject(e.target.error);
        };
    });
}

// Load settings from IndexedDB
async function loadSettings() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        const request = store.get(1);
        
        request.onsuccess = function(event) {
            const settings = event.target.result;
            if (settings) {
                // Apply saved volume
                if (settings.volume) {
                    volumeControl.value = settings.volume;
                }
                
                // Apply saved player color
                if (settings.playerColor) {
                    recordPlayer.style.backgroundColor = settings.playerColor;
                    // Update selected color option
                    colorOptions.forEach(option => {
                        if (option.getAttribute('data-color') === settings.playerColor) {
                            option.classList.add('selected');
                        } else {
                            option.classList.remove('selected');
                        }
                    });
                }
            }
            resolve(settings);
        };
        
        request.onerror = function(e) {
            reject(e.target.error);
        };
    });
}

// Save album art to IndexedDB
async function saveAlbumArt(imageDataUrl) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['albumArt'], 'readwrite');
        const store = transaction.objectStore('albumArt');
        
        const artData = {
            id: 'lastUploaded',
            dataUrl: imageDataUrl,
            timestamp: new Date().getTime()
        };
        
        const request = store.put(artData);
        
        request.onsuccess = function() {
            lastUploadedImage = imageDataUrl;
            resolve();
        };
        
        request.onerror = function(e) {
            reject(e.target.error);
        };
    });
}

// Load album art from IndexedDB
async function loadAlbumArt() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['albumArt'], 'readonly');
        const store = transaction.objectStore('albumArt');
        const request = store.get('lastUploaded');
        
        request.onsuccess = function(event) {
            const artData = event.target.result;
            if (artData) {
                lastUploadedImage = artData.dataUrl;
            }
            resolve(artData);
        };
        
        request.onerror = function(e) {
            reject(e.target.error);
        };
    });
}

// Save track data and audio file to IndexedDB
async function saveTrack(title, artist, image, audioBlob) {
    return new Promise((resolve, reject) => {
        // First save the audio file
        const audioTransaction = db.transaction(['audioFiles'], 'readwrite');
        const audioStore = audioTransaction.objectStore('audioFiles');
        
        const audioId = `audio_${new Date().getTime()}`;
        const audioData = {
            id: audioId,
            blob: audioBlob,
            timestamp: new Date().getTime()
        };
        
        const audioRequest = audioStore.add(audioData);
        
        audioRequest.onsuccess = function() {
            // Then save the track metadata
            const trackTransaction = db.transaction(['tracks'], 'readwrite');
            const trackStore = trackTransaction.objectStore('tracks');
            
            const trackData = {
                title: title,
                artist: artist,
                image: image,
                audioId: audioId,
                timestamp: new Date().getTime()
            };
            
            const trackRequest = trackStore.add(trackData);
            
            trackRequest.onsuccess = function(event) {
                resolve(event.target.result); // Return the track ID
            };
            
            trackRequest.onerror = function(e) {
                reject(e.target.error);
            };
        };
        
        audioRequest.onerror = function(e) {
            reject(e.target.error);
        };
    });
}

// Load user tracks from IndexedDB
async function loadUserTracks() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['tracks', 'audioFiles'], 'readonly');
        const trackStore = transaction.objectStore('tracks');
        const audioStore = transaction.objectStore('audioFiles');
        
        const request = trackStore.getAll();
        
        request.onsuccess = async function(event) {
            const tracks = event.target.result;
            
            // Process each track
            for (const track of tracks) {
                try {
                    // Get the audio file for this track
                    const audioData = await new Promise((resolveAudio, rejectAudio) => {
                        const audioRequest = audioStore.get(track.audioId);
                        
                        audioRequest.onsuccess = function(e) {
                            resolveAudio(e.target.result);
                        };
                        
                        audioRequest.onerror = function(e) {
                            rejectAudio(e.target.error);
                        };
                    });
                    
                    if (audioData && audioData.blob) {
                        // Create object URL for the blob
                        const objectURL = URL.createObjectURL(audioData.blob);
                        
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
                            title: track.title,
                            artist: track.artist,
                            image: track.image,
                            id: track.id
                        });
                        
                        // Create vinyl item in selector
                        const index = songs.length - 1;
                        addVinylItemToSelector(track.title, track.artist, track.image, index, track.id);
                    }
                } catch (error) {
                    console.error('Error loading track:', error);
                }
            }
            
            resolve();
        };
        
        request.onerror = function(e) {
            reject(e.target.error);
        };
    });
}

// Initialize demo tracks
function loadDemoTracks() {
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
async function handleFileUpload(event) {
    const files = event.target.files;
    if (!files.length) return;
    
    // Process each file
    for (const file of Array.from(files)) {
        try {
            // Extract file name (will be used as title)
            const title = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
            
            // Pick a random image for this track or use the last uploaded one
            const albumImage = lastUploadedImage || defaultAlbumImages[Math.floor(Math.random() * defaultAlbumImages.length)];
            
            // Create a copy of the file as Blob for storage
            const audioBlob = file.slice(0, file.size, file.type);
            
            // Save track to IndexedDB
            await saveTrack(title, "Unknown Artist", albumImage, audioBlob);
            
            // Create object URL for playback
            const objectURL = URL.createObjectURL(file);
            
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
        } catch (error) {
            console.error('Error processing file:', error);
            alert(`Error processing file: ${file.name}`);
        }
    }
    
    // Clear the file input to allow uploading the same file again
    fileUpload.value = '';
    
    // Display the vinyl selector
    vinylSelector.style.display = 'block';
}

// Handle image upload
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        // Read the file as Data URL
        const imageDataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e);
            reader.readAsDataURL(file);
        });
        
        // Save to IndexedDB
        await saveAlbumArt(imageDataUrl);
        
        // Alert the user
        alert("Image uploaded successfully! It will be used for the next audio file you upload.");
    } catch (error) {
        console.error('Error processing image:', error);
        alert('Error uploading image.');
    }
    
    // Clear the file input to allow uploading the same image again
    imageUpload.value = '';
}

// Add vinyl item to selector
function addVinylItemToSelector(title, artist, image, index, trackId) {
    const vinylItem = document.createElement('div');
    vinylItem.className = 'vinyl-item';
    vinylItem.setAttribute('data-song', index);
    if (trackId) {
        vinylItem.setAttribute('data-track-id', trackId);
    }
    
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
    
    // Auto-play the vinyl with realistic needle movement
    moveNeedleToRecord(() => {
        startPlayback();
    });
    
    // Save last played index to settings
    saveSettings({ lastPlayedIndex: index });
}

// Realistic needle movement
function moveNeedleToRecord(callback) {
    // First position: needle starts moving from the rest position
    playerArm.style.transition = 'transform 0.8s ease-out';
    playerArm.style.transform = 'rotate(-20deg)';
    
    // Add sound effect for needle movement (optional)
    playNeedleSound('moving');
    
    // Clear any existing timeout
    if (needleMovementTimeout) {
        clearTimeout(needleMovementTimeout);
    }
    
    // After a delay, move needle to the record
    needleMovementTimeout = setTimeout(() => {
        // Second position: needle reaches the record edge
        playerArm.style.transform = 'rotate(-5deg)';
        
        // Play needle drop sound
        playNeedleSound('drop');
        
        // After needle drops, move to final position and start playback
        needleMovementTimeout = setTimeout(() => {
            // Final position: needle on the record
            playerArm.style.transform = 'rotate(0deg)';
            
            // Execute callback (start playback)
            if (callback) callback();
        }, 300);
    }, 800);
}

// Simulate needle lifting
function liftNeedle(callback) {
    // First movement: needle starts lifting
    playerArm.style.transition = 'transform 0.6s ease-in-out';
    playerArm.style.transform = 'rotate(-10deg)';
    
    // Add sound effect for needle lifting (optional)
    playNeedleSound('lifting');
    
    // Clear any existing timeout
    if (needleMovementTimeout) {
        clearTimeout(needleMovementTimeout);
    }
    
    // After a delay, move needle to rest position
    needleMovementTimeout = setTimeout(() => {
        // Return to rest position
        playerArm.style.transform = 'rotate(-45deg)';
        
        // Execute callback if provided
        if (callback) callback();
    }, 600);
}

// Play needle sound effects (placeholder function - implement actual sounds as needed)
function playNeedleSound(type) {
    // This is a placeholder for actual sound implementation
    console.log(`Playing needle ${type} sound`);
    
    // You could implement actual sounds like this:
    /*
    const sound = new Howl({
        src: [`needle_${type}.mp3`],
        volume: 0.5
    });
    sound.play();
    */
}

function startPlayback() {
    if (!currentSong || currentVinylIndex === -1) return;
    
    // Visual updates
    activeRecord.classList.add('spinning');
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
    playingIndicator.classList.remove('active');
    playPauseButton.textContent = '▶️';
    nowPlaying.classList.remove('active');
    
    // Lift the needle realistically before stopping
    liftNeedle(() => {
        // Stop the audio
        currentSong.stop();
        isPlaying = false;
    });
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
                
                // Make the needle move slightly randomly to simulate vibration on a real record
                simulateNeedleVibration();
            }
        }
    }, 100);
}

// Simulate slight needle vibration for realism
function simulateNeedleVibration() {
    // Only apply vibration if we're playing
    if (!isPlaying) return;
    
    // Get current rotation
    const currentRotation = playerArm.style.transform;
    const baseRotation = 0; // Base rotation when playing
    
    // Generate a tiny random variance
    const variance = (Math.random() * 0.6 - 0.3); // Between -0.3 and +0.3 degrees
    
    // Apply the variance
    playerArm.style.transition = 'transform 0.1s ease';
    playerArm.style.transform = `rotate(${baseRotation + variance}deg)`;
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

// Add a clear IndexedDB button (optional)
function addClearDBButton() {
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear Saved Tracks';
    clearButton.style.margin = '10px';
    clearButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all saved tracks?')) {
            clearDatabase().then(() => {
                alert('All saved data cleared. Refresh the page to see changes.');
                window.location.reload();
            }).catch(error => {
                console.error('Error clearing database:', error);
                alert('Error clearing saved data.');
            });
        }
    });
    
    // Add button to the page (adjust this to fit your layout)
    document.body.appendChild(clearButton);
}

// Clear the entire database
async function clearDatabase() {
    const storeNames = ['tracks', 'audioFiles', 'albumArt'];
    const promises = [];
    
    for (const storeName of storeNames) {
        promises.push(new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = function() {
                resolve();
            };
            
            request.onerror = function(e) {
                reject(e.target.error);
            };
        }));
    }
    
    return Promise.all(promises);
}
'use strict';
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
class Workout {
    constructor(coords, distance, duration) {
      this.date = new Date();
      this.id=this._generateUUID();
      this.coords = coords; // [lat, lng]
      this.distance = distance; // in km
      this.duration = duration; // in min
      this.clicks=0;
    }

    _generateUUID() {
      const uuid = window.uuid || uuid; // Use global uuid or the one provided by the library
      return uuid.v4();
    }
  
    _setDescription() {
      // prettier-ignore
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
      this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
        months[this.date.getMonth()]
      } ${this.date.getDate()}`;
    }
  
    click() {
      this.clicks++;
    }
    calcPace() {
      return this.pace = this.duration / this.distance;
    }
  
  }

  class Running extends Workout {
    
  
    constructor(coords, distance, duration, cadence) {
      super(coords, distance, duration);
      this.cadence = cadence;
      this.type = 'running';
      this._setDescription();
      this.pace=this.calcPace;
    }
  
  }
  
  class Cycling extends Workout {
  
    constructor(coords, distance, duration, elevationGain) {
      super(coords, distance, duration);
      this.elevationGain = elevationGain;
      this.type = 'cycling';
      this._setDescription();
      this.speed=this.calcPace();
    }
  
    calcPace() {
      // km/h
      return this.speed = this.distance / (this.duration / 60);
    
    }
  }  

class App{
 

  constructor(){
    this._map;
    this._mapZoomLevel = 13;
    this._mapEvent;
    this._workouts = [];
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this)); 
    
  }


  _getPosition(){
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(`https://www.google.pt/maps/@${latitude},${longitude}`);
    
    const coords = [latitude, longitude];
    
    this._map = L.map('map').setView(coords, this._mapZoomLevel);
    
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._map);
    
    // Handling clicks on map
    this._map.on('click', this._showForm.bind(this));
    
    this._workouts.forEach(work => {
    this._renderWorkoutMarker(work);
    });
  }
  _toggleElevationField(){
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
  }


  _showForm(mapE) {
    this._mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // Empty inputs
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value ='';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }


  _newWorkout(e){
  const validInputs =(...inputs) => 
  inputs.every(inp => Number.isFinite(inp) && inp > 0);;

  e.preventDefault();

// Get data from form
  const type = inputType.value;
  const distance = +inputDistance.value;
  const duration = +inputDuration.value;
  const { lat, lng } = this._mapEvent.latlng;
  let workout;

  // If workout running, create running object
  if (type === 'running') {
    const cadence = +inputCadence.value;

  // Check if data is valid
  if (!validInputs(distance, duration, cadence)) 
    return alert('Inputs have to be positive numbers!');

  workout = new Running([lat, lng], distance, duration, cadence);

  }


  // If workout cycling, create cycling object
  if (type === 'cycling') {
    const elevation = +inputElevation.value;

  if (!validInputs(distance, duration, elevation) )
    return alert('Inputs have to be positive numbers!');

  workout = new Cycling([lat, lng], distance, duration, elevation);
  }

// Add new object to workout array
  this._workouts.push(workout);

// Render workout on map as marker
  this._renderWorkoutMarker(workout);

// Render workout on list
  this._renderWorkout(workout);

// Hide form + clear input fields
  this._hideForm();

// Set local storage to all workouts
  this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this._map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.calcPace().toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
    `;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
        
      </li>
      `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }


  _moveToPopup(e) {
    
    if (!this._map) return;

    const workoutElement = e.target.closest('.workout');

    if (!workoutElement) return;

    const result= this._workouts.find(
      work => work.id === workoutElement.dataset.id
    );

    this._map.setView(result.coords, this._mapZoomLevel, {
      animate: true,
      pan: {duration: 1,},
    });

  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this._workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    const workoutClasses = {
      running: Running,
      cycling: Cycling,
      // Add more workout types here as needed...
    };
    
    if (!data) return;


    this._workouts = data.map((workoutData) => {
      const workoutType = workoutClasses[workoutData.type];

      // Create a new instance of the respective workout type with Object.create()
      const workout = Object.create(workoutType.prototype);

      // Assign the properties from the stored data to the workout object
      Object.assign(workout, workoutData);

      return workout;
    });

    this._workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }

}

const app = new App();


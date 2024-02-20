class Star {
    constructor(massG, massI, posX, posY, velX, velY, color,type) {
        this.type = type;
        this.massG = massG; // Gravitational mass
        this.massI = massI; // Inertial mass
        this.posX = posX; // position x
        this.posY = posY; // position y
        this.velX = velX; // vitesse x
        this.velY = velY; // vitesse y
        this.color = color; // Color of the star
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.posX, this.posY, 0.5, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    updatePosition(deltaTime, forceX, forceY,BoundR) {
        const accelX = forceX / this.massI;
        const accelY = forceY / this.massI;
        this.velX += accelX * deltaTime;
        this.velY += accelY * deltaTime;
        this.posX += this.velX * deltaTime;
        this.posY += this.velY * deltaTime;
        this.checkBoundaryCondition(speed_init,angleVariance,BoundR);
    }
    checkBoundaryCondition(initialDarkMatterSpeed,angleVariance,BoundRadius) {
        const boundaryRadius = BoundRadius; // Half of the canvas size
        const distanceFromCenter = Math.sqrt((this.posX - centerX) ** 2 + (this.posY - centerY) ** 2);

        if (distanceFromCenter > boundaryRadius) {
            if (this.type === 'matter') {
                // Move the matter particle outside the canvas to cancel effect far away , -> useless condition , for auto gravitation matter never go outside
                this.posX = 10000+100*Math.random();
                this.posY = 10000+100*Math.random();
                this.velX = 0;
                this.velY = 0;

            } else if (this.type === 'darkMatter') {
                // Place the Nega matter particle at a random position along the circular boundary -> to have effect of "zero divergence" far the galaxy at boundary simulation
                // the size of galaxy need to be small to "dont affect"  Nega matter at boundary , and not have no desirable effet of flow NegaMatter
                const angle = Math.random() * 2 * Math.PI;
                this.posX = centerX + boundaryRadius * Math.cos(angle);
                this.posY = centerY + boundaryRadius * Math.sin(angle);

                /// Set the velocity with a random variation around the inward angle (mimic pseudo divergence null of matter far the galaxy)
                const inwardAngle = Math.atan2(centerY - this.posY, centerX - this.posX);
                const randomAngle = inwardAngle + (Math.random() - 0.5) * angleVariance;
                const speed = Math.abs(initialDarkMatterSpeed);
                this.velX = speed * Math.cos(randomAngle);
                this.velY = speed * Math.sin(randomAngle);
            }
        }
    }

}
function calculateDarkMatterDensity(darkMatterStars, boundaryRadius) {
    let totalMass = 0;
    darkMatterStars.forEach(star => {
        totalMass += star.massG;
    });

    const surface =  Math.PI * Math.pow(boundaryRadius, 2);
    return totalMass / surface;
}
function calculateFictiveDarkMatterMass(darkMatterStars, boundaryRadius) {
    let totalMass = 0;
    darkMatterStars.forEach(star => {
        totalMass += star.massG; // Assuming massG is the mass of the dark matter star
    });

    const volume = (4 / 3) * Math.PI * Math.pow(boundaryRadius, 3);
    return totalMass / volume;
}
function updateGalaxy(stars, deltaTime,BoundRad) {
    stars.forEach((star, index) => {
        let forceX = 0;
        let forceY = 0;

        stars.forEach((otherStar, otherIndex) => {
            if (index !== otherIndex) {
                const force = star.computeForce(otherStar);
                forceX += force.forceX;
                forceY += force.forceY;
            }
        });

        star.updatePosition(deltaTime, forceX, forceY,BoundRad);
    });
}

// Example initialization


// Function to generate random values within a specified range
function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function initMatterCluster(numStars,massG,Size=20,elipse=1,speedscale=0.000003,color='rgba(130, 255, 255, 0.3)') {
    const matterStars = [];
    for (let i = 0; i < numStars; i++) {

        const matterColor = color;

        const mass = massG; // 10^12/10^4 ( total galaxy solar mass / nmbr star)
        const angle = randomBetween(0, 2 * Math.PI);
        const radius = randomBetween(0.01, Size); // Distance from the center (in pixel)
        //const posX = centerX + radius * Math.cos(angle) * scale*1;
        //const posY = centerY + radius * Math.sin(angle) * scale;
        const posX = centerX + radius * Math.cos(angle)*elipse;
        const posY = centerY + radius * Math.sin(angle);
        let velX=0
        let velY=0
        let ad=speedscale
        // Velocity for rotational motion

        velX = -radius * Math.sin(angle)* ad;
        velY = radius * Math.cos(angle) * ad;



        matterStars.push(new Star(mass, Math.abs(mass), posX, posY, velX, velY,matterColor,'matter'));
    }
    return matterStars;
}

function initDarkMatterCluster(numStars, speed,massG,size=120,color='rgba(255, 0, 0, 1)') {
    const darkMatterStars = [];
    const darkMatterColor =color; 
    //const kB = 8.617333262145e-5; // Boltzmann constant in eV/K

    //const speed = Math.sqrt(kB * temperature); // Simplified speed calculation

    for (let i = 0; i < numStars; i++) {
        const mass = massG;
        const angle = randomBetween(0, 2 * Math.PI);
        const minRadius = size; // Minimum radius to create a hole in the center
        const radius = randomBetween(minRadius, centerX);
        const posX = (centerX + radius * Math.cos(angle));
        const posY = (centerY + radius * Math.sin(angle));

        // Random direction velocity based on temperature
        const velAngle = randomBetween(0, 2 * Math.PI);
        const velX = speed * Math.cos(velAngle) ;
        const velY = speed * Math.sin(velAngle);

        darkMatterStars.push(new Star(mass, Math.abs(mass), posX, posY, velX, velY,darkMatterColor,'darkMatter'));
    }
    return darkMatterStars;
}
function drawBoundary() {
    const boundaryRadius = canvasWidth/2; // Half of the canvas size
    ctx.beginPath();
    ctx.arc(centerX, centerY, boundaryRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'green'; // You can choose any color for the boundary
    ctx.stroke();
}

let computeForcesKernel;

function initializeComputeForcesKernel(numStars) {
    // If a kernel already exists, destroy it
    if (computeForcesKernel) {
        computeForcesKernel.destroy();
    }

    // Initialize GPU instance if not already initialized or if destroyed
    const gpu = new GPU.GPU();

    // Adjust the output size based on the number of stars
    const outputSize = numStars * 2; // Assuming you want double the input number

    // Create a new kernel with the updated output size
    computeForcesKernel = gpu.createKernel(function(starMasses, starPositionsX, starPositionsY, G, darkMatterDensity, boundaryRadius,centerX,centerY) {
        let forceX = 0;
        let forceY = 0;
        const myPosX = starPositionsX[this.thread.x];
        const myPosY = starPositionsY[this.thread.x];
        const myMass = starMasses[this.thread.x];

        for (let i = 0; i < this.constants.numStars; i++) {
            if (i !== this.thread.x) {
                const dx = starPositionsX[i] - myPosX;
                const dy = starPositionsY[i] - myPosY;
                let distance= Math.sqrt(dx * dx + dy * dy) + 1;

                const forceMagnitude = G * myMass * starMasses[i] / (distance * distance);
                forceX += forceMagnitude * (dx / distance);
                forceY += forceMagnitude * (dy / distance);
            }
        }

        // Additional fictive force due to constant Negative matter density outside (homogene density)
        //const r = Math.sqrt(myPosX * myPosX + myPosY * myPosY);
        const distanceFromCentere = Math.sqrt((myPosX - centerX) * (myPosX - centerX) + (myPosY - centerY) *(myPosY - centerY) );
        //console.log("distanceFromCenter", distanceFromCentere)
        if (distanceFromCentere <= boundaryRadius) {

           // fictive "shadow of negaMatter outside the simulation" (Big lacune + Nega matter inside = 0 (infinite homogeneous repartition) ) 
            const fictivemass = Math.PI * distanceFromCentere*distanceFromCentere*darkMatterDensity 
            const forceMagnitude = G * myMass * fictivemass /(distanceFromCentere*distanceFromCentere);
            forceX += forceMagnitude * ((myPosX - centerX) / distanceFromCentere);
            forceY += forceMagnitude * ((myPosY - centerY) / distanceFromCentere);
        }

        return [forceX, forceY];
    }, {
        constants: { numStars: outputSize },
        output: [outputSize]
    });
}



function updateGalaxyGPU(stars, deltaTime, G, darkMatterDensity, boundaryRadius) {
    // Prepare data for GPU
    const starMasses = stars.map(star => star.massG);
    const starPositionsX = stars.map(star => star.posX);
    const starPositionsY = stars.map(star => star.posY);
    const starVelocitiesX = stars.map(star => star.velX);
    const starVelocitiesY = stars.map(star => star.velY);
    const starMassI = stars.map(star => star.massI);
    const types = stars.map(star => star.type === 'matter' ? 0 : 1);  // Assuming 'type' property exists
    //console.log(types)

    // First kernel to compute forces
    const forces = computeForcesKernel(starMasses, starPositionsX, starPositionsY, G, darkMatterDensity, boundaryRadius,centerX,centerY);
    const forcesX = forces.map(force => force[0]);
    const forcesY = forces.map(force => force[1]);

    // Second kernel to update positions and velocities test with kernel GPU
    /*const updatedValues = updatePositionKernel(
        starPositionsX, starPositionsY, starVelocitiesX, starVelocitiesY, 
        forcesX, forcesY, starMassI, types, deltaTime, boundaryRadius
    );*/



    // Update the stars array with new positions and velocities cpu

    for (let i = 0; i < stars.length; i++) {
        /*console.log( forcesX[i], forcesY[i])
        /*console.log( starPositionsX[i])
        if(forcesX[i]== NaN || starPositionsX[i]== NaN ){
        console.log( forcesX[i], forcesY[i])
    }*/
       // console.log(forcesX[i], forcesY[i])
       stars[i].updatePosition(deltaTime, forcesX[i], forcesY[i],boundaryRadius);

        /*stars[i].posX = updatedValues[i][0];
        stars[i].posY = updatedValues[i][1];
        stars[i].velX = updatedValues[i][2];
        stars[i].velY = updatedValues[i][3];*/
    }
}

// Function to convert hex color to RGBA
function hexToRGBA(hex, opacity) {
    let r = 0, g = 0, b = 0;
    // 3 digits
    if (hex.length == 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    }
    // 6 digits
    else if (hex.length == 7) {
        r = parseInt(hex[1] + hex[2], 16);
        g = parseInt(hex[3] + hex[4], 16);
        b = parseInt(hex[5] + hex[6], 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}


const canvas = document.getElementById('galaxyCanvas');
const ctx = canvas.getContext('2d');

let scale = 1/2000; // Example scale: 1 pixel per 2000 light-year

let G = 1.56*Math.pow(10,-13) * scale * scale * scale ; // Adjusted G from ly^3 / (M☉ * yr^2) to px^3 / (M☉ * yr^2)

let deltaTime = 100000 ; // Time step for simulation year 

let numStars = 20000; // Number of stars for each type (total stars = 2 * numstars)

let massNeg = -1000000000 // solar mass
let massPos = 500000000 // solar mass

let hole=120 //size of the neg Hole in pixel
let galactR=20 //size of the galaxy in pixel

let elips=1 // circular = 1 , full ellipse = 0.1 galaxy shape
let speedRot=0.0000002 // scale of circular mouvement rad/year ? not sure 

const canvasWidth = 2400;
const canvasHeight = 2400;
const centerX = canvasWidth / 2;
const centerY = canvasHeight / 2;
//const scale = 200; // Scale factor to convert pixels to light years
let temprature_init=0.000005 // more a scale than a true T° ... ( need to be "high" -> No Jean's instability , Janus Scenario)

let colorNeg='rgba(255, 0, 0, 1)'
let colorPos='rgba(130, 255, 255, 0.3)'

//const kB = 8.617333262145e-5; // ev/k
let speed_init = 0.00000065 ; // pixel/year , tuned empirically to match the condition of No jean's instability in Nega matter

const angleVariance = Math.PI ;

let stars = [];
let animationFrameId;


// Function to initialize simulation
ctx.fillStyle = 'black';
ctx.fillRect(0, 0, canvas.width, canvas.height);


function updateSimulationParameters() {
    scale = parseFloat(document.getElementById('scale').value);
    G = 1.56*Math.pow(10,-13) * scale * scale * scale ; // Recalculate G based on new scale
    deltaTime = parseInt(document.getElementById('deltaTime').value, 10);
    numStars = parseInt(document.getElementById('numStars').value, 10);
    massNeg = parseFloat(document.getElementById('massNeg').value);
    massPos = parseFloat(document.getElementById('massPos').value);
    hole = parseInt(document.getElementById('hole').value, 10);
    galactR = parseInt(document.getElementById('galactR').value, 10);
    elips = parseFloat(document.getElementById('elips').value);
    speedRot = parseFloat(document.getElementById('speedRot').value);
    speed_init = parseFloat(document.getElementById('speed_init').value); // Retrieve initial temperature
     // Fetch the star color
    let colorNega = document.getElementById('starColorNegative').value;
    let colorPosa = document.getElementById('starColorPositive').value;
    // Fetch and convert the opacity
    let starOpacityNeg = parseInt(document.getElementById('starOpacityNeg').value, 10) / 100; // Convert to a 0-1 scale
    let starOpacityPos = parseInt(document.getElementById('starOpacityPos').value, 10) / 100; // Convert to a 0-1 scale
    // Convert hex color to RGBA
    colorNeg = hexToRGBA(colorNega, starOpacityNeg);

    colorPos = hexToRGBA(colorPosa, starOpacityPos);
    // Log to console for verification, can be removed later

    // Log to console for verification, can be removed later
    console.log("Updated Parameters:", {scale, G, deltaTime, numStars, massNeg, massPos, hole, galactR, elips, speedRot});
    initializeComputeForcesKernel(numStars*2);
    initSimulation()
}
document.getElementById('initButton').addEventListener('click', updateSimulationParameters);
document.getElementById('runButton').addEventListener('click', animate);

function initSimulation() {


    // If there's an existing animation frame, cancel it
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    // Reset the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw the circular boundary
    drawBoundary();
    // Assume initMatterCluster and initDarkMatterCluster are defined elsewhere
    const matterStars = initMatterCluster(numStars, massPos, galactR, elips, speedRot,colorPos);
    //let speed_init = Math.sqrt(kB * temprature_init);
    const darkMatterStars = initDarkMatterCluster(numStars, speed_init, massNeg, hole,colorNeg );
    darkMatterDensity = calculateDarkMatterDensity(darkMatterStars, canvas.width / 2);

    // Combine the stars
    stars = [...matterStars, ...darkMatterStars];

    // You can also draw the initial state of stars here if needed
    stars.forEach(star => {
        star.draw();
    });
}


// Modified animate function to start animation
function animate() {
    animationFrameId = requestAnimationFrame(animate);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the circular boundary and update galaxy
    drawBoundary();
    updateGalaxyGPU(stars, deltaTime, G, darkMatterDensity, canvas.width / 2);

    // Draw stars
    stars.forEach(star => {
        star.draw();
    });
}

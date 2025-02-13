function SimpleColor(red, green, blue, alpha){
    this.red = red;
    this.green = green;
    this.blue = blue;
    this.alpha = alpha;
}

function GameMap(width, height) {
    this.CHANNEL_COUNT = 4; // Number of channels (colors) in mapData
    this.mapData = {}; // Actual map data stored as a bitmap
    this.width = width; // Width of the map
    this.height = height; // Height of the map

    // Getting the neighbors of each index required a lot of functions 
    //  that cluttered the GameMap object. Therefore, I moved them into
    //  a sub-object called getIndex to keep each of the functions
    //  organized. Please note that you do need to inject a reference
    //  of this object into the getIndex object after creation.
    this.getIndex = {
        gameMap : {},

        clampIndexToMapSize : function(i){
            i = i < 0 ? -1 : i // Return -1 if out of lower bounds
            i = i > (this.gameMap.width*this.gameMap.height*this.gameMap.CHANNEL_COUNT) ? -1 : i // Return -1 if out of upper bounds
            return i
        },
    
        above : function(i) {
            var val = i - (this.gameMap.width * this.gameMap.CHANNEL_COUNT) // Calculate position one row above
            val = this.clampIndexToMapSize(val);
            return val
        },
    
        below : function(i) {
            var val = i + (this.gameMap.width * this.gameMap.CHANNEL_COUNT) // Calculate position one row above
            val = this.clampIndexToMapSize(val);
            return val
        },
    
        right : function(i) {
            var val = i + this.gameMap.CHANNEL_COUNT // Calculate position one row above
            val = this.clampIndexToMapSize(val);
            return val
        },
    
        left : function(i) {
            var val = i - this.gameMap.CHANNEL_COUNT // Calculate position one row above
            val = this.clampIndexToMapSize(val);
            return val
        },
    
        aboveLeft : function(i){
            var val = this.above(i);
            val = this.left(val);
            val = this.clampIndexToMapSize(val);
            return val;
        },
    
        aboveRight : function(i){
            var val = this.above(i);
            val = this.right(val);
            val = this.clampIndexToMapSize(val);
            return val;
        },
    
        belowLeft : function(i){
            var val = this.below(i);
            val = this.left(val);
            val = this.clampIndexToMapSize(val);
            return val;
        },
    
        belowRight : function(i){
            var val = this.below(i);
            val = this.right(val);
            val = this.clampIndexToMapSize(val);
            return val;
        },
    
        cardinalNeighbors : function(i){
            return [this.above(i), this.below(i), this.left(i), this.right(i)];
        },
    
        neighbors : function(i){
            var vals = [this.above(i), 
                    this.below(i), 
                    this.left(i), 
                    this.right(i),
                    this.aboveLeft(i),
                    this.aboveRight(i),
                    this.belowLeft(i),
                    this.belowRight(i)];
            return vals;
        }
    };

    this.getIndex.gameMap = this; // Inject a reference of this class into the getIndex object

    this.createMap = function(){
        this.mapData = createImage(this.width, this.height);
        this.mapData.loadPixels()
        for (let i = 0; i < this.mapData.pixels.length; i+=4) {
            // Default
            this.mapData.pixels[i] = 0; // red
            this.mapData.pixels[i+1] = 0; // green
            this.mapData.pixels[i+2] = 0; // blue
            this.mapData.pixels[i+3] = 255; // alpha
    
            // Randomly place some red noise
            var c = random(100);
            if(c < 30 && i > (this.height*0.60)*this.width*this.CHANNEL_COUNT){
                this.mapData.pixels[i] = 255; // red
                this.mapData.pixels[i+1] = 0; // green
                this.mapData.pixels[i+2] = 0; // blue
                this.mapData.pixels[i+3] = 255; // alpha
            }
    
            // Floor
            if(i > (this.height*0.95)*this.width*this.CHANNEL_COUNT){
                this.mapData.pixels[i] = 255; // red
                this.mapData.pixels[i+1] = 0; // green
                this.mapData.pixels[i+2] = 0; // blue
                this.mapData.pixels[i+3] = 255; // alpha
            }
        }
        this.mapData.updatePixels();
    };

    this.getNeighbors = function(x,y,size=1,includeCenter=false){
        var neighbors = [];
        for (let fx = -size; fx <= size; fx++) {
            for (let fy = -size; fy <= size; fy++) {
                if(!includeCenter && fx==0 && fy==0){ continue; }

                let pos = {};
                pos.x = x+fx;
                pos.y = y+fy;

                if(pos.x < 0 || pos.x >= this.width || pos.y < 0 || pos.y >= this.height){ 
                    pos.x = -1;
                    pos.y = -1;
                }

                neighbors.push(pos);
            }
        }
        return neighbors;
    };

    this.growMap = function(chanceOfGrowth){
        this.mapData.loadPixels(); // Initialize pixel array
        let reds = [] // List of (x,y) coords of pixels that should be turned red
    
        // Determine which pixels should flip to be red 
        // and which should be black.
        for(let x = 0; x < this.width; x++){
            for (let y = 0; y < this.height; y++) {
                let redValueAtXY = this.getPixelValue(x,y).red;
                if(redValueAtXY == 255){
                    reds.push({"x":x,"y":y})// Keep it on

                    // Random chance to flip neighbors to red
                    if(random(100) < chanceOfGrowth){
                        // Add each neighbor to the list of neighbors to turn red
                        neighbors = this.getNeighbors(x, y);
                        neighbors.forEach(neighbor => {
                            if(neighbor.x != -1 && neighbor.y != -1){
                                reds.push(neighbor)
                            }
                        });
                    }
                }
            }
        }

        // Flip pixels as needed
        let red = new SimpleColor(255,0,0,255);
        this.setPixelsToColor(reds, red);
    
        this.mapData.updatePixels();
    };

    this.setPixelsToColor = function(pixels, c){
        for (let i = 0; i < pixels.length; i++) {
            let x = pixels[i].x;
            let y = pixels[i].y;
            this.setPixelValue(x,y,c);
        }
    };

    this.countRedNeighbors = function(neighborPositions){
        let redNeighbors = 0;
        for (let i = 0; i < neighborPositions.length; i++) {
            const neighborPosition = neighborPositions[i];
            if(neighborPosition.x == -1 && neighborPosition.y == -1){
                redNeighbors += 0.5; // Adding 0, or 1 makes for some weird results.
                                    // Experimentation led to 0.5
            }
            else{
                let neighborColor = this.getPixelValue(neighborPosition.x, neighborPosition.y);
                if(neighborColor.red == 255){
                    redNeighbors += 1.0;
                }
            }
        }
        return redNeighbors;
    }

    this.cleanMap = function(redNeighborsNeededToStayRed){
    
        this.mapData.loadPixels(); // Initialize pixel array
        let reds = [] // List of (x,y) coords of pixels that should be turned red
        let clears = [] // List of (x,y) coords of pixels that should be made transparent

        let redNeighborsList = [];

        // Determine which pixels should flip to be red 
        // and which should be clear.
        for(let x = 0; x < this.width; x++){
            for (let y = 0; y < this.height; y++) {
                let redNeighbors = 0;
                let neighbors = this.getNeighbors(x,y);

                redNeighbors = this.countRedNeighbors(neighbors);

                redNeighborsList.push(redNeighbors);
                // If the pixel has enough red neighbors
                if(redNeighbors >= redNeighborsNeededToStayRed){
                    reds.push({"x":x,"y":y});
                }
                else{
                    clears.push({"x":x,"y":y});
                }
            }
        }
    
        // Flip pixels as needed
        let red = new SimpleColor(255,0,0,255);
        let clear = new SimpleColor(0,0,0,0);
        this.setPixelsToColor(reds, red);
        this.setPixelsToColor(clears, clear);
    
        this.mapData.updatePixels();
    };

    this.processMap = function(){
        // All values are from trial and error
        let chanceOfGrowth = 25;
        let neighborBias = 6;
        let numberOfPasses = 30;

        console.log("Processing map...")
        for (let i = 0; i < numberOfPasses; i++) {
            this.growMap(chanceOfGrowth);
            this.cleanMap(neighborBias);
            console.log("%f % complete", Math.round((i/numberOfPasses)*100))
        }

        // I found that maps look best if grow a few more times after processing
        this.growMap(chanceOfGrowth);
        this.growMap(chanceOfGrowth);

        console.log("The map has been successfully processed.")
    };

    this.getPixelIndex = function(x,y){
        return ((this.width * y + x) * this.CHANNEL_COUNT);
    };

    this.getPixelValue = function(x,y){
        let index = this.getPixelIndex(x, y);
        let red = this.mapData.pixels[index];
        let green = this.mapData.pixels[index+1];
        let blue = this.mapData.pixels[index+2];
        let alpha = this.mapData.pixels[index+3];
        let c = new SimpleColor(red, green, blue, alpha)
        return c;
    };

    this.setPixelValue = function(x,y,c){
        let index = this.getPixelIndex(x, y);
        this.mapData.pixels[index] = c.red; // Red
        this.mapData.pixels[index+1] = c.green; // Green
        this.mapData.pixels[index+2] = c.blue; // Blue
        this.mapData.pixels[index+3] = c.alpha; // Alpha
    };

    this.setSquare = function(x,y,w,h,c){
        for (let fx = 0; fx < w; fx++) {
            for (let fy = 0; fy < h; fy++) {
                this.setPixelValue(x+fx,y+fy,c);
            }
        }
    };
}

var Game = {
    width : 640, // Width of the canvas
    height : 480, // Height of the canvas
    level : {
        map : new GameMap(640, 480), 
        }
    
}

// Camera position
var x = 0;
var y = 0;

function setup() {
    createCanvas(Game.width, Game.height);

    Game.level.map.createMap();
    Game.level.map.processMap();

    //Game.level.map.mapData.resize(Game.level.map.width*2, Game.level.map.height*2)
}

function drawBackground(){
    // Save canvas context
    push();

    // Black stripes
    fill(0,0,0);
    rect(0,0,Game.width, Game.height);
    
    // Yellow stripes
    let stripeSize = 10;
    stroke(255,255,0);
    strokeWeight(stripeSize/2);
    for (let i = 0; i < Game.height/stripeSize*2; i++) {
        if(i % 2 == 0){
            let j = Game.height/stripeSize;
            j -= i;
            line(0, j*10, Game.width, Game.height+(j*10))
        }
    }

    // Restore canvas context
    pop();
}

var rectx = 20;
var animCount = 0;

function draw() {
    // Background
    drawBackground();

    // Move Camera
    translate(x,y);

    // Draw Map
    image(Game.level.map.mapData, 0, 0);

    cameraMovement()
}

function cameraMovement(){
    let speed = 10
    if(keyIsDown(LEFT_ARROW)){
        x+=speed;
    }
    if(keyIsDown(RIGHT_ARROW)){
        x-=speed;
    }
    if(keyIsDown(UP_ARROW)){
        y+=speed;
    }
    if(keyIsDown(DOWN_ARROW)){
        y-=speed;
    }
}
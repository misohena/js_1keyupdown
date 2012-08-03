

function main()
{
    var canvas = document.getElementById("canvas");
    if(!canvas.getContext){
        return;
    }

    var game = new Game(canvas);
    game.start();
}


// ---------------------------------------------------------------------------
// class ButtonState
// ---------------------------------------------------------------------------
function ButtonState()
{
    this.initialize.apply(this, arguments);
}
ButtonState.prototype = {
    initialize: function()
    {
        this.pressed = false;
    },

    isPressed: function()
    {
        return this.pressed;
    },

    setPressed: function(down)
    {
        this.pressed = down;
    }
};




// ---------------------------------------------------------------------------
// class Obstacle
// ---------------------------------------------------------------------------
function Obstacle()
{
    this.initialize.apply(this, arguments);
}
Obstacle.prototype = {
    initialize: function(model, x, y, radius, speed)
    {
        this.model = model;
        this.position = new Vector2(x, y);
        this.radius = radius;
        this.color = "#ff0000";
        this.speed = speed;
    },


    advanceTime: function(dt)
    {
        this.position.x += -this.speed * dt;
    },


    isDead: function()
    {
        return this.position.x < this.model.FIELDAREA_LEFT - this.radius;
    }
};


// ---------------------------------------------------------------------------
// class LifeUpBall
// ---------------------------------------------------------------------------
function LifeUpBall()
{
    this.initialize.apply(this, arguments);
}
LifeUpBall.prototype = {
    initialize: function(model, x, y, radius, speed)
    {
        this.model = model;
        this.position = new Vector2(x, y);
        this.radius = radius;
        this.color = "#00ff33";
        this.speed = speed;
    },


    advanceTime: function(dt)
    {
        this.position.x += -this.speed * dt;
    },


    isDead: function()
    {
        return this.position.x < this.model.FIELDAREA_LEFT - this.radius;
    }
};


// ---------------------------------------------------------------------------
// class GameModel
// ---------------------------------------------------------------------------

function GameModel()
{
    this.initialize.apply(this, arguments);
}

GameModel.prototype = {
    initialize: function(canvasSizeX, canvasSizeY)
    {
        this.canvasSizeX = canvasSizeX;
        this.canvasSizeY = canvasSizeY;

        this.gameTime = 0.0;
        this.gameStarted = false;
        this.gameFinished = false;

        this.gameProgressDistance = 0.0;

        this.buttonA = new ButtonState();

        this.objects = new Array();

        this.initPlayer(canvasSizeX, canvasSizeY);

        this.obstacleTime = 0.0;
	this.lifeupballTime = 10.0;

        this.FIELDAREA_LEFT = 0.0;
        this.FIELDAREA_TOP = 0.0;
        this.FIELDAREA_RIGHT = canvasSizeX;
        this.FIELDAREA_BOTTOM = canvasSizeY;

        this.SCROLLSPEED = 100.0;

        this.GUTTER_HEIGHT = 20.0;
        this.gutterTop = this.GUTTER_HEIGHT;
        this.gutterBottom = canvasSizeY - this.GUTTER_HEIGHT;
    },


    isPlaying: function()
    {
        return this.gameStarted && !this.gameFinished;
    },
    
    isStarted: function()
    {
        return this.gameStarted;
    },
    
    isFinished: function()
    {
        return this.gameFinished;
    },

    startGame: function()
    {
        this.gameStarted = true;
    },

    finishGame: function()
    {
        this.gameFinished = true;
    },
    

    advanceTime: function(dt)
    {
        if(!this.isPlaying()){
            return;
        }

        
        this.gameTime += dt;
        this.gameProgressDistance += dt * this.SCROLLSPEED;

        // move player
        this.advancePlayerTime(dt);

        // create new obstacles
        this.obstacleTime += dt;
        while(this.obstacleTime >= 0.75){
            this.obstacleTime -= 0.75;

            var r = 30.0 + Math.random() * this.gameProgressDistance / 100.0;
            var speed = this.SCROLLSPEED;
            this.objects.push(new Obstacle(this, this.FIELDAREA_RIGHT + r, (this.FIELDAREA_BOTTOM - this.FIELDAREA_TOP) * Math.random() + this.FIELDAREA_TOP, r, speed));
        }

	// create new life up ball
	if(this.playerLife < 0.8){
	    this.lifeupballTime -= dt;
	    if(this.lifeupballTime <= 0){
		var r = 30.0 + Math.random() * this.gameProgressDistance / 100.0;
		//var r = Math.max(5.0, 40.0 - this.gameProgressDistance / 1000.0);
		this.objects.push(new LifeUpBall(this, this.FIELDAREA_RIGHT + r, (this.FIELDAREA_BOTTOM - this.FIELDAREA_TOP) * Math.random() + this.FIELDAREA_TOP, r, this.SCROLLSPEED * 1.2));
		this.lifeupballTime = 2.0 + Math.random() * 5.0;
	    }
	}
        
        // move objects
        for(var i = 0; i < this.objects.length; i++){
            this.objects[i].advanceTime(dt);

            if(this.objects[i].isDead()){
                this.objects.splice(i, 1);
                --i;
            }
            
        }
        
    },



    initPlayer: function(canvasSizeX, canvasSizeY)
    {
        this.playerVelocity = new Vector2(0, 0);
        this.playerPosition = new Vector2(canvasSizeX/3, canvasSizeY/2);
        this.playerRadius = 10;
        this.playerLife = 1.0;
        this.playerLastDamageTime = -9999;
    },


    advancePlayerTime: function(dt)
    {
        var accY = 0;

        if(this.buttonA.isPressed()){
            accY -= 30.0;
        }
        accY += 15.0;

        this.playerVelocity.y += dt * accY;
        this.playerPosition.y += this.playerVelocity.y;

        // foreach intersection objects
        for(var i = 0; i < this.objects.length; i++){
            var o = this.objects[i];
            var radius = o.radius + this.playerRadius;
            var distSq = o.position.distanceSqFrom(this.playerPosition);
            if(distSq < radius * radius){
                if((typeof o == "object") && (o instanceof Obstacle)){
                    this.decreasePlayerLife(dt);
                }
                if((typeof o == "object") && (o instanceof LifeUpBall)){
                    this.increasePlayerLife(dt);
                }
            }
        }

        // gutter
        if(this.playerPosition.y - this.playerRadius < this.gutterTop){
            this.decreasePlayerLife(dt);
        }
        if(this.playerPosition.y + this.playerRadius > this.gutterBottom){
            this.decreasePlayerLife(dt);
        }

        // out of field
        if(this.playerPosition.y < this.gutterTop){
            this.playerPosition.y = this.gutterTop;
            this.playerVelocity.y = 0;
        }
        if(this.playerPosition.y > this.gutterBottom){
            this.playerPosition.y = this.gutterBottom;
            this.playerVelocity.y = 0;
        }
        
    },


    decreasePlayerLife: function(dt)
    {
        this.playerLastDamageTime = this.gameTime;
        this.playerLife -= 0.5 * dt;
        if(this.playerLife <= 0){
            this.playerLife = 0;
            this.finishGame();
        }
        
    },

    increasePlayerLife: function(dt)
    {
        this.playerLife += 0.8 * dt;
        if(this.playerLife >= 1.0){
            this.playerLife = 1.0;
        }
        
    },

    getElapsedFromLastDamage: function()
    {
        return this.gameTime - this.playerLastDamageTime;
    }
    
    
};



// ---------------------------------------------------------------------------
// class Game
// ---------------------------------------------------------------------------

function Game()
{
    this.initialize.apply(this, arguments);
}

Game.prototype = {
    initialize: function(canvas)
    {
        this.intervalId = null;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.TIMER_PERIOD = 50;

        this.model = new GameModel(canvas.width, canvas.height);

        this.initKeyHandler();
        this.initMouseHandler();
    },

    start: function()
    {
        var self = this;
        this.intervalId = window.setInterval(function(){self.advanceTime(self.TIMER_PERIOD/1000.0);}, this.TIMER_PERIOD);
    },

    stop: function()
    {
        if(this.intervalId){
            window.clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },
    
    advanceTime: function(dt)
    {
        this.model.advanceTime(dt);
        this.paint();
    },

    // View

    paint: function()
    {
        this.paintField();


        // draw overlapped text.
        var ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = "#ffffff";

        if(!this.model.isStarted()){
            drawText(ctx, "CLICK TO START", this.canvas.width/2 - 14*16/2, this.canvas.height/2, 16, 16);
        }
        
        if(this.model.isFinished()){
            drawText(ctx, "GAME OVER", this.canvas.width/2 - 9*16/2, this.canvas.height/2, 16, 16);

        }

        // draw score.
        var distStr = Math.floor(this.model.gameProgressDistance).toString(10)  + " PIXELS";
        drawText(ctx, distStr, this.canvas.width - 4 - distStr.length * 16, 4, 16, 16);

        // paint player life.
        var lifeBarWidth = canvas.width/2 - 2;
        lifeBarWidth *= this.model.playerLife;
        ctx.fillStyle = "#0088ff";
        ctx.fillRect(this.canvas.width/2, this.canvas.height - 10, lifeBarWidth, 8);

        ctx.restore();
    },


    paintField: function()
    {
        var ctx = this.ctx;
        ctx.save();


        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = this.model.getElapsedFromLastDamage() < 0.1 ? (Math.floor(this.model.gameTime * 16) % 2 ? "#440000" : "#000000") : "#000000";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        var t = this.model.gameTime;


        // draw objects
        for(var i = 0; i < this.model.objects.length; i++){
            var position = this.model.objects[i].position;
            var radius = this.model.objects[i].radius;
            var color = this.model.objects[i].color;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(position.x, position.y);
            ctx.arc(position.x, position.y, radius, 0, Math.PI*2, true);
            ctx.fill();
        }

        // draw player token
        var px = this.model.playerPosition.x;
        var py = this.model.playerPosition.y;
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#325fa2";
        ctx.fillStyle = "#bbd400";
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.arc(px, py, this.model.playerRadius, 0, Math.PI*2, true);
        ctx.fill();

        // draw gutters
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(0, 0, this.canvas.width, this.model.gutterTop);
        ctx.fillRect(0, this.model.gutterBottom, this.canvas.width, this.canvas.height - this.model.gutterBottom);
        
        
        ctx.restore();
    },

    // Key Event Handler

    initKeyHandler: function()
    {
        var self = this;
        window.document.onkeydown = function(e){ self.onKeyDown(e);};
        window.document.onkeyup = function(e){ self.onKeyUp(e);};
    },
    
    onKeyDown: function(e)
    {
        this.onKey(e, true);
    },

    onKeyUp: function(e)
    {
        this.onKey(e, false);
    },
    
    onKey: function(e, down)
    {
        var keycode = e ? e.which : window.event.keyCode;
        var ctrl = e ? (typeof e.modifiers == 'undefined' ? e.ctrlKey : e.modifiers & Event.CONTROL_MASK) : event.ctrlKey;
        var shift = e ? (typeof e.modifiers == 'undefined' ? e.shiftKey : e.modifiers & Event.SHIFT_MASK) : event.shiftKey;

/*
        if(e){
            e.preventDefault();
            e.stopPropagation();
        }
        else{
            event.returnValue = false; 
            event.cancelBubble = true; 
        }
*/
        
        if(keycode == 0x20){
            this.model.buttonA.setPressed(down);
        }
    },



    initMouseHandler: function()
    {
        var self = this;
        canvas.addEventListener("mousedown", function(e){self.onMouseDown(e);}, false);
        canvas.addEventListener("mouseup", function(e){self.onMouseUp(e);}, false);
    },


    onMouseDown: function(e)
    {
        if(!this.model.isStarted()){
            this.model.startGame();
        }

        this.model.buttonA.setPressed(true);
    },

    onMouseUp: function(e)
    {
        this.model.buttonA.setPressed(false);
    }
    
    
};




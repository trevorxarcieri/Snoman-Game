//setup canvas
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width = window.innerWidth;
const HEIGHT = canvas.height = window.innerHeight;

const NUM_SNOWFS = 100;
const NUM_SNOWBS = 3;
const SNOWF_RAD = 6;
const SNOWF_SKY = HEIGHT / 10;
const SNOWF_PACK = 5;
const WIND_SPD = 1.2;
const FALL_SPD = 2;
const SNOWB_FALL_ACC = .2;
const BUFFER = 4;
const MIN_VY = .001;
const SNOWF_INC = .5;
const SNOWB_RADS = [40, 30, 20];
const HIT_BOX = 1.3;
const SNOWB_PACK_F = 2;
const SNOWF_COLOR = `rgb(${245},${255},${255})`;
const SNOWB_COLOR = `rgb(${245},${255},${255})`;

//Array for snowflakes
var snowFs = [];
//Array for stopped snowflakes
const snowFsStopped = [];
//Array for snowballs
const snowBs = [];
let curBall;

let mouseDown = false;

class Circle
{
    constructor(x, y, vX, vY, color, rad)
    {
        this.x = x;
        this.y = y;
        this.vX = vX;
        this.vY = vY;
        this.color = color;
        this.rad = rad;
    }

    draw()
    {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.rad, 0, 2 * Math.PI);
        ctx.fill();
    }

    update(i)
    {
        if((this.x + this.rad >= WIDTH - BUFFER && this.vX > 0) || (this.x - this.rad <= 0 + BUFFER && this.vX < 0))
        {
            this.vX = -this.vX;
        }
        if(this.y + this.rad >= HEIGHT - BUFFER)
        {
            this.vY = 0;
            this.vX = 0;
            this.stop(i);
            return false;
        }
        this.x += this.vX;
        this.y += this.vY;
        return true;
    }

    collision(circ, i)
    {
        if(this.dist(circ.x, circ.y) < this.rad + circ.rad - SNOWF_PACK && circ.vY == 0)
        {
            this.vX = 0;
            this.vY = 0;
            this.stop(i);   
            return false;
        }
        return true;
    }

    dist(x, y)
    {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

class SnowF extends Circle
{
    static init()
    {
        while(snowFs.length < NUM_SNOWFS)
        {
            snowFs.push(new SnowF(false));
        }
    }

    static loop()
    {
        let initStopped = snowFsStopped.length;
        for(let i = 0; i < snowFs.length; i++)
        {
            let snowF2 = snowFs[i];
            snowF2.draw();
            if(snowF2.update(i))
            {
                snowF2.collision(i);
            }
            if(initStopped < snowFsStopped.length)
            {
                i--;
            }
            initStopped = snowFsStopped.length;
        }
        for(let i = 0; i < snowFsStopped.length; i++)
        {
            let snowF = snowFsStopped[i];
            snowF.draw(i);
        }
    }

    constructor(bool)
    {
        if(bool)
        {
            super(random(0 + SNOWF_RAD, WIDTH - SNOWF_RAD),
            random(0 + SNOWF_RAD, SNOWF_SKY - SNOWF_RAD),
            random(-WIND_SPD, WIND_SPD),
            FALL_SPD, SNOWF_COLOR, SNOWF_RAD);
        }
        else
        {
            super(random(0 + SNOWF_RAD, WIDTH - SNOWF_RAD),
            random(0 + SNOWF_RAD, HEIGHT - SNOWF_RAD),
            random(-WIND_SPD, WIND_SPD),
            FALL_SPD, SNOWF_COLOR, SNOWF_RAD);
        }
    }

    update(i)
    {
        this.vX = random(-WIND_SPD, WIND_SPD);
        return super.update(i);
    }

    collision(i)
    {
        for(const snowF3 of snowFsStopped)
        {
            if(!(this === snowF3))
            {
                if(!super.collision(snowF3, i))
                {
                    break;
                }
            }
        }
    }

    stop(i)
    {
        snowFs.splice(i, 1);
        snowFsStopped.push(this);
        snowFs.push(new SnowF(true));
    }
}

class SnowB extends Circle
{
    static init()
    {
        // for(let i = 0; i < NUM_SNOWBS; i++)
        // {
        //     snowBs.push(new SnowB(true, i));
        // }
    }

    static loop()
    {
        for(let i = 0; i < snowBs.length; i++)
        {
            let snowB = snowBs[i];
            if(snowB.moveDown)
            {
                snowB.vY = MIN_VY;
                snowB.moveDown = false;
            }
            snowB.draw(i);
            if(curBall != snowBs[i])
            {
                if(snowB.collision())
                {
                    snowB.update(i);
                }
            }
        }
    }

    draw(i)
    {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.rad, 0, 2 * Math.PI);
        ctx.fill();
    }

    static checkContact(e)
    {
        let ball;
        for(let i = 0; i < snowBs.length; i++)
        {
            ball = snowBs[i];
            if(ball.dist(e.x, e.y) < ball.rad + HIT_BOX)
            {
                curBall = ball;
                curBall.distX = e.x - curBall.x;
                curBall.distY = e.y - curBall.y;
            }
        }
        if(curBall == null)
        {
            let flake;
            for(let i = 0; i < snowFsStopped.length; i++)
            {
                flake = snowFsStopped[i];
                if(flake.dist(e.x, e.y) < flake.rad)
                {
                    snowFsStopped.splice(i, 1);
                    curBall = new SnowB(false, 0, flake);
                    snowBs.push(curBall);
                    curBall.distX = e.x - curBall.x;
                    curBall.distY = e.y - curBall.y;
                    break;
                }
            }
        }
    }

    constructor(bool, i, snowF)
    {
        if(bool)
        {
            let rad = SNOWB_RADS[i];
            super(random(0 + rad, WIDTH - rad),
                HEIGHT - rad - BUFFER,
                0, 0, 
                SNOWB_COLOR,
                rad);
            for(let i2 = 0; i2 < snowBs.length; i2++)
            {
                let ball = snowBs[i2];
                if(ball.dist(this.x, this.y) < ball.rad + this.rad + 2 * HIT_BOX)
                {
                    return new SnowB(i);
                }
            }
        }
        else
        {
            super(snowF.x, snowF.y, 0, 0, SNOWF_COLOR, snowF.rad);
        }
    }

    move(e)
    {
        this.x = e.x - this.distX;
        this.y = e.y - this.distY;
        this.buildBall();
    }

    buildBall()
    {
        let snowF;
        for(let i = 0; i < snowFsStopped.length; i++)
        {
            snowF = snowFsStopped[i];
            if(this.dist(snowF.x, snowF.y) < this.rad + snowF.rad)
            {
                snowFsStopped.splice(i, 1);
                i--;
                curBall.rad += SNOWF_INC;
            }
        }
    }

    update(i)
    {
        if(this.vY != 0)
        {
            this.vY += SNOWB_FALL_ACC;
        }
        return super.update(i);
    }

    stop()
    {
        this.vY = 0;
    }

    collision()
    {
        let ball;
        for(let i = 0; i < snowBs.length; i++)
        {
            ball = snowBs[i];
            if(this.dist(ball.x, ball.y) < this.rad + ball.rad - SNOWB_PACK_F && ball.vY == 0 && ball.y > this.y)
            {
                this.stop();
                return false;
            }
        }
        return true;
    }
}

//This program calls the run function
run();

function run()
{
    init();
    loop();
}

function init()
{
    SnowF.init();
    SnowB.init();
    canvas.addEventListener('mousedown', (e) => 
    {
        onMouseDown(e);
    });
    canvas.addEventListener('mouseup', (e) =>
    {
        onMouseUp(e);
    });
    canvas.addEventListener('mousemove', (e) =>
    {
        onMouseMove(e);
    });
}

function onMouseDown(e)
{
    mouseDown = true;
    SnowB.checkContact(e);
    try
    {
        curBall.stop();
    }
    catch(error){}
}

function onMouseUp(e)
{
    try
    {
        mouseDown = false;
        curBall.vY = MIN_VY;
        curBall = null;
    }
    catch(error){}
}

function onMouseMove(e)
{
    if(mouseDown)
    {
        try
        {
            curBall.move(e);
        }
        catch(error){}
        for(let i = 0; i < snowBs.length; i++)
        {
            snowB = snowBs[i];
            if(snowB != curBall && snowB.vY == 0)
            {
                snowB.moveDown = true;
            }
        }
    }
}

function loop()
{
    ctx.fillStyle = 'rgba(22, 221, 252, .8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    SnowF.loop();
    SnowB.loop();
    requestAnimationFrame(loop);
}

//function to generate random number
function random(min, max)
{
    var num = Math.floor(Math.random() * (max - min + 1)) + min;
    return num;
}

// function randomRGB() 
// {
//     return `rgb(${random(0, 255)},${random(0, 255)},${random(0, 255)})`;
// }

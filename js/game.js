// 游戏常量
const GRID_SIZE = 20; // 调整为更合适的格子大小
const GAME_SPEED = {
    easy: 120,
    medium: 80,
    hard: 50
};
const TRAP_REFRESH_INTERVAL = 5000; // 陷阱刷新间隔，固定为5秒

// 特殊食物常量
const SPECIAL_FOOD_TYPES = {
    NORMAL: 'normal',  // 普通食物 - 红色苹果 10分
    ORANGE: 'orange',  // 橙色苹果 30分
    PURPLE: 'purple',  // 紫色苹果 50分
    RAINBOW: 'rainbow' // 彩色苹果 100分
};

const SPECIAL_FOOD_CONFIG = {
    [SPECIAL_FOOD_TYPES.ORANGE]: {
        points: 30,                 // 得分
        spawnInterval: 15000,       // 生成间隔 (ms)
        duration: 5000,             // 持续时间 (ms)
        warningTime: 1000,          // 消失前警告时间 (ms)
        color: '#FF9800',           // 颜色
        shadowColor: 'rgba(255, 152, 0, 0.7)' // 发光效果颜色
    },
    [SPECIAL_FOOD_TYPES.PURPLE]: {
        points: 50,
        spawnInterval: 20000,
        duration: 5000,
        warningTime: 1000,
        color: '#9C27B0',
        shadowColor: 'rgba(156, 39, 176, 0.7)'
    },
    [SPECIAL_FOOD_TYPES.RAINBOW]: {
        points: 100,
        spawnInterval: 25000,
        duration: 3000,
        warningTime: 1000,
        color: 'rainbow',
        shadowColor: 'rgba(255, 255, 255, 0.7)'
    }
};

// 游戏状态
let snake = [];
let food = { type: SPECIAL_FOOD_TYPES.NORMAL, x: 0, y: 0 };
let specialFoods = []; // 特殊食物数组
let traps = []; // 陷阱数组，每个陷阱是包含多个格子位置的数组
let trapRemovalTime = 0; // 陷阱应该消失的时间
let trapGenerationInterval = 5000; // 陷阱更新间隔，默认5秒
let lastTrapGenerationTime = 0; // 上次生成陷阱的时间
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let gameInterval;
let isPaused = false;
let gameStarted = false;
let difficultyLevel = 'medium'; // 默认难度改为中等
let soundEnabled = true;
let colors = ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#FFEB3B']; // 彩色蛇身
let isAccelerated = false; // 新增：是否处于加速状态

// 游戏时间控制变量
let lastUpdateTime = 0;
let updateInterval = GAME_SPEED.easy; // 默认更新间隔
let animationId = null; // 用于存储requestAnimationFrame的ID
let lastRenderTime = 0;

// 特殊食物时间控制变量
let lastSpecialFoodSpawnTimes = {
    [SPECIAL_FOOD_TYPES.ORANGE]: 0,
    [SPECIAL_FOOD_TYPES.PURPLE]: 0,
    [SPECIAL_FOOD_TYPES.RAINBOW]: 0
};

// 平滑移动动画变量
let animationProgress = 1.0; // 范围从0到1，表示移动动画的进度
let previousPositions = []; // 用于存储蛇的前一个位置，用于动画

// 排行榜数据
const MAX_LEADERBOARD_ENTRIES = 8; // 排行榜最大条目数
let leaderboardData = []; // 存储排行榜数据
let newHighScore = false; // 是否刚刚产生新高分

// 音效
const sounds = {
    eat: new Audio('sounds/eat.wav'),
    gameOver: new Audio('sounds/game-over.wav'),
    background: new Audio('sounds/backgound.wav'),
    button: new Audio('sounds/button.wav'),
    click: new Audio('sounds/click.wav')
};

// 设置背景音乐循环播放
sounds.background.loop = true;
sounds.background.volume = 0.3; // 降低背景音乐音量

// 预加载食物图像
const foodImages = {
    [SPECIAL_FOOD_TYPES.NORMAL]: new Image(),
    [SPECIAL_FOOD_TYPES.ORANGE]: new Image(),
    [SPECIAL_FOOD_TYPES.PURPLE]: new Image(),
    [SPECIAL_FOOD_TYPES.RAINBOW]: new Image()
};

// 设置食物图像源
foodImages[SPECIAL_FOOD_TYPES.NORMAL].src = 'images/apple.png';

// 修改原有的appleImage变量指向normal食物图像
const appleImage = foodImages[SPECIAL_FOOD_TYPES.NORMAL];

// 预加载石头陷阱图像
const trapImage = new Image();
trapImage.src = 'images/trap.png';
// 如果没有陷阱图像，可以在游戏加载时创建一个
trapImage.onerror = function() {
    // 创建一个临时canvas来生成石头陷阱图像
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = GRID_SIZE;
    tempCanvas.height = GRID_SIZE;
    const tempCtx = tempCanvas.getContext('2d');
    
    // 绘制石头形状
    tempCtx.fillStyle = '#757575'; // 石头灰色
    tempCtx.beginPath();
    tempCtx.arc(GRID_SIZE/2, GRID_SIZE/2, GRID_SIZE/2 - 2, 0, Math.PI * 2);
    tempCtx.fill();
    
    // 添加纹理
    tempCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    tempCtx.beginPath();
    tempCtx.arc(GRID_SIZE/2 - GRID_SIZE/4, GRID_SIZE/2 - GRID_SIZE/5, GRID_SIZE/8, 0, Math.PI * 2);
    tempCtx.fill();
    
    tempCtx.beginPath();
    tempCtx.arc(GRID_SIZE/2 + GRID_SIZE/6, GRID_SIZE/2 + GRID_SIZE/6, GRID_SIZE/10, 0, Math.PI * 2);
    tempCtx.fill();
    
    // 将临时canvas的内容作为图像源
    trapImage.src = tempCanvas.toDataURL();
};

// 如果没有普通苹果图像，可以在游戏加载时创建一个
appleImage.onerror = function() {
    // 创建一个临时canvas来生成苹果图像
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = GRID_SIZE;
    tempCanvas.height = GRID_SIZE;
    const tempCtx = tempCanvas.getContext('2d');
    
    // 绘制红色圆形
    tempCtx.fillStyle = '#F44336';
    tempCtx.beginPath();
    tempCtx.arc(GRID_SIZE/2, GRID_SIZE/2, GRID_SIZE/2 - 2, 0, Math.PI * 2);
    tempCtx.fill();
    
    // 添加高光
    tempCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    tempCtx.beginPath();
    tempCtx.arc(GRID_SIZE/3, GRID_SIZE/3, GRID_SIZE/6, 0, Math.PI * 2);
    tempCtx.fill();
    
    // 添加绿色叶子
    tempCtx.fillStyle = '#4CAF50';
    tempCtx.beginPath();
    tempCtx.ellipse(GRID_SIZE/2, 2, GRID_SIZE/6, GRID_SIZE/10, 0, 0, Math.PI * 2);
    tempCtx.fill();
    
    // 将临时canvas的内容作为图像源
    appleImage.src = tempCanvas.toDataURL();
};

// 创建橙色苹果图像
foodImages[SPECIAL_FOOD_TYPES.ORANGE].src = 'images/orange_apple.png';
foodImages[SPECIAL_FOOD_TYPES.ORANGE].onerror = function() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = GRID_SIZE;
    tempCanvas.height = GRID_SIZE;
    const tempCtx = tempCanvas.getContext('2d');
    
    // 绘制橙色圆形
    tempCtx.fillStyle = '#FF9800';
    tempCtx.beginPath();
    tempCtx.arc(GRID_SIZE/2, GRID_SIZE/2, GRID_SIZE/2 - 2, 0, Math.PI * 2);
    tempCtx.fill();
    
    // 添加高光
    tempCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    tempCtx.beginPath();
    tempCtx.arc(GRID_SIZE/3, GRID_SIZE/3, GRID_SIZE/6, 0, Math.PI * 2);
    tempCtx.fill();
    
    // 添加绿色叶子
    tempCtx.fillStyle = '#4CAF50';
    tempCtx.beginPath();
    tempCtx.ellipse(GRID_SIZE/2, 2, GRID_SIZE/6, GRID_SIZE/10, 0, 0, Math.PI * 2);
    tempCtx.fill();
    
    // 将临时canvas的内容作为图像源
    foodImages[SPECIAL_FOOD_TYPES.ORANGE].src = tempCanvas.toDataURL();
};

// 创建紫色苹果图像
foodImages[SPECIAL_FOOD_TYPES.PURPLE].src = 'images/purple_apple.png';
foodImages[SPECIAL_FOOD_TYPES.PURPLE].onerror = function() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = GRID_SIZE;
    tempCanvas.height = GRID_SIZE;
    const tempCtx = tempCanvas.getContext('2d');
    
    // 绘制紫色圆形
    tempCtx.fillStyle = '#9C27B0';
    tempCtx.beginPath();
    tempCtx.arc(GRID_SIZE/2, GRID_SIZE/2, GRID_SIZE/2 - 2, 0, Math.PI * 2);
    tempCtx.fill();
    
    // 添加高光
    tempCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    tempCtx.beginPath();
    tempCtx.arc(GRID_SIZE/3, GRID_SIZE/3, GRID_SIZE/6, 0, Math.PI * 2);
    tempCtx.fill();
    
    // 添加绿色叶子
    tempCtx.fillStyle = '#4CAF50';
    tempCtx.beginPath();
    tempCtx.ellipse(GRID_SIZE/2, 2, GRID_SIZE/6, GRID_SIZE/10, 0, 0, Math.PI * 2);
    tempCtx.fill();
    
    // 将临时canvas的内容作为图像源
    foodImages[SPECIAL_FOOD_TYPES.PURPLE].src = tempCanvas.toDataURL();
};

// 创建彩色苹果图像
foodImages[SPECIAL_FOOD_TYPES.RAINBOW].src = 'images/rainbow_apple.png';
foodImages[SPECIAL_FOOD_TYPES.RAINBOW].onerror = function() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = GRID_SIZE;
    tempCanvas.height = GRID_SIZE;
    const tempCtx = tempCanvas.getContext('2d');
    
    // 创建彩虹渐变
    const gradient = tempCtx.createRadialGradient(
        GRID_SIZE/2, GRID_SIZE/2, 0,
        GRID_SIZE/2, GRID_SIZE/2, GRID_SIZE/2
    );
    gradient.addColorStop(0, '#FF0000');
    gradient.addColorStop(0.17, '#FF9800');
    gradient.addColorStop(0.33, '#FFEB3B');
    gradient.addColorStop(0.5, '#4CAF50');
    gradient.addColorStop(0.67, '#2196F3');
    gradient.addColorStop(0.83, '#9C27B0');
    gradient.addColorStop(1, '#E91E63');
    
    // 绘制彩虹圆形
    tempCtx.fillStyle = gradient;
    tempCtx.beginPath();
    tempCtx.arc(GRID_SIZE/2, GRID_SIZE/2, GRID_SIZE/2 - 2, 0, Math.PI * 2);
    tempCtx.fill();
    
    // 添加高光
    tempCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    tempCtx.beginPath();
    tempCtx.arc(GRID_SIZE/3, GRID_SIZE/3, GRID_SIZE/6, 0, Math.PI * 2);
    tempCtx.fill();
    
    // 添加绿色叶子
    tempCtx.fillStyle = '#4CAF50';
    tempCtx.beginPath();
    tempCtx.ellipse(GRID_SIZE/2, 2, GRID_SIZE/6, GRID_SIZE/10, 0, 0, Math.PI * 2);
    tempCtx.fill();
    
    // 将临时canvas的内容作为图像源
    foodImages[SPECIAL_FOOD_TYPES.RAINBOW].src = tempCanvas.toDataURL();
};

// 获取DOM元素
const menuElement = document.getElementById('menu');
const settingsElement = document.getElementById('settings');
const helpElement = document.getElementById('help');
const gameElement = document.getElementById('game');
const gameOverElement = document.getElementById('game-over');
const leaderboardElement = document.getElementById('leaderboard');
const leaderboardEntriesElement = document.getElementById('leaderboard-entries');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const difficultySelect = document.getElementById('difficulty');
const soundCheckbox = document.getElementById('sound');

// 按钮元素
const startBtn = document.getElementById('start-btn');
const settingsBtn = document.getElementById('settings-btn');
const helpBtn = document.getElementById('help-btn');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const backBtn = document.getElementById('back-btn');
const helpBackBtn = document.getElementById('help-back-btn');
const leaderboardBackBtn = document.getElementById('leaderboard-back-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const backToMenuBtn = document.getElementById('back-to-menu-btn');

// 全局缩放因子
let scale = window.devicePixelRatio || 1;

// 创建并缓存网格背景
let gridBackground = null;

// 初始化游戏
function initGame() {
    // 预加载所有音频
    for (const key in sounds) {
        sounds[key].load();
    }
    
    // 加载排行榜数据
    loadLeaderboard();
    
    // 启用硬件加速
    canvas.style.transform = 'translateZ(0)';
    canvas.style.backfaceVisibility = 'hidden';
    
    // 设置画布大小
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 初始化蛇
    resetGame();
    
    // 添加事件监听器
    document.addEventListener('keydown', handleKeyPress);
    
    // 添加按钮点击事件
    startBtn.addEventListener('click', () => {
        playSound('click');
        // 确保在开始游戏前重新调整画布大小
        resizeCanvas();
        startGame();
    });
    
    settingsBtn.addEventListener('click', () => {
        playSound('click');
        showSettings();
    });
    
    helpBtn.addEventListener('click', () => {
        playSound('click');
        showHelp();
    });
    
    leaderboardBtn.addEventListener('click', () => {
        playSound('click');
        showLeaderboard();
    });
    
    backBtn.addEventListener('click', () => {
        playSound('click');
        showMenu();
    });
    
    helpBackBtn.addEventListener('click', () => {
        playSound('click');
        showMenu();
    });
    
    leaderboardBackBtn.addEventListener('click', () => {
        playSound('click');
        showMenu();
    });
    
    backToMenuBtn.addEventListener('click', () => {
        playSound('click');
        showMenu();
    });
    
    pauseBtn.addEventListener('click', () => {
        playSound('click');
        togglePause();
    });
    
    restartBtn.addEventListener('click', () => {
        playSound('click');
        startGame();
    });
    
    menuBtn.addEventListener('click', () => {
        playSound('click');
        showMenu();
    });
    
    // 添加按钮悬停事件
    addButtonHoverEffects();
    
    difficultySelect.addEventListener('change', () => {
        difficultyLevel = difficultySelect.value;
        playSound('click');
    });
    
    // 设置默认难度选项
    difficultySelect.value = 'medium';
    difficultyLevel = 'medium';
    
    soundCheckbox.addEventListener('change', () => {
        soundEnabled = soundCheckbox.checked;
        
        // 如果禁用音效，停止背景音乐
        if (!soundEnabled && sounds.background) {
            sounds.background.pause();
        } else if (gameStarted && !isPaused) {
            // 如果启用音效且游戏正在进行，播放背景音乐
            playBackgroundMusic();
        }
        
        playSound('click');
    });
    
    // 添加触摸控制
    addTouchControls();
    
    // 预渲染一次游戏场景
    drawGame();
}

// 添加按钮悬停效果
function addButtonHoverEffects() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            playSound('button');
        });
    });
}

// 调整画布大小
function resizeCanvas() {
    const containerWidth = gameElement.clientWidth;
    const canvasWidth = containerWidth - 20; // 减去一些边距
    
    // 计算能够容纳整数个格子的画布高度和宽度
    const gridCountX = Math.floor(canvasWidth / GRID_SIZE);
    const gridCountY = Math.floor(Math.min(containerWidth - 20, 600) / GRID_SIZE);
    
    // 确保画布尺寸是格子大小的整数倍，保证格子为正方形
    const adjustedWidth = gridCountX * GRID_SIZE;
    const adjustedHeight = gridCountY * GRID_SIZE;
    
    // 仅当尺寸变化时才重设画布
    if (canvas.width !== adjustedWidth * scale || canvas.height !== adjustedHeight * scale) {
        // 设置Canvas的显示大小
        canvas.style.width = adjustedWidth + 'px';
        canvas.style.height = adjustedHeight + 'px';
        
        // 设置Canvas的实际分辨率
        scale = window.devicePixelRatio || 1;
        canvas.width = adjustedWidth * scale;
        canvas.height = adjustedHeight * scale;
        
        // 重置上下文状态
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // 缩放上下文以匹配设备像素比
        ctx.scale(scale, scale);
        
        // 使用更好的图像平滑算法
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 如果游戏已经开始，则重新绘制
        if (gameStarted) {
            drawGame();
        }
    }
}

// 重置游戏状态
function resetGame() {
    // 计算网格数量
    const gridCountX = Math.floor(canvas.width / scale / GRID_SIZE);
    const gridCountY = Math.floor(canvas.height / scale / GRID_SIZE);
    
    // 初始化蛇（3个身体部分）
    const centerX = Math.floor(gridCountX / 2);
    const centerY = Math.floor(gridCountY / 2);
    
    snake = [
        { x: centerX, y: centerY },
        { x: centerX - 1, y: centerY },
        { x: centerX - 2, y: centerY }
    ];
    
    // 清除之前的位置
    previousPositions = [];
    
    // 清除陷阱和计时器
    traps = [];
    trapRemovalTime = 0;
    lastTrapGenerationTime = 0;
    
    // 清除特殊食物
    specialFoods = [];
    
    // 重置特殊食物生成时间
    Object.keys(lastSpecialFoodSpawnTimes).forEach(type => {
        lastSpecialFoodSpawnTimes[type] = 0;
    });
    
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    scoreElement.textContent = '0';
    generateFood();
    isPaused = false;
    isAccelerated = false; // 重置加速状态
    pauseBtn.textContent = '暂停';
    
    // 重置动画进度
    animationProgress = 1.0;
}

// 生成普通食物
function generateFood() {
    // 计算最大坐标，确保与绘制的格子数量一致
    const gridCountX = Math.floor(canvas.width / scale / GRID_SIZE);
    const gridCountY = Math.floor(canvas.height / scale / GRID_SIZE);
    
    // 创建可用位置数组
    const availablePositions = [];
    
    // 创建一个地图标记蛇身占用的格子、陷阱和特殊食物
    const occupiedMap = new Map();
    
    // 标记蛇占用的格子
    snake.forEach(segment => {
        const key = `${segment.x},${segment.y}`;
        occupiedMap.set(key, true);
    });
    
    // 标记陷阱占用的格子
    traps.forEach(trap => {
        trap.forEach(cell => {
            const key = `${cell.x},${cell.y}`;
            occupiedMap.set(key, true);
        });
    });
    
    // 标记特殊食物占用的格子
    specialFoods.forEach(food => {
        const key = `${food.x},${food.y}`;
        occupiedMap.set(key, true);
    });
    
    // 收集所有可用位置
    for (let x = 0; x < gridCountX; x++) {
        for (let y = 0; y < gridCountY; y++) {
            const key = `${x},${y}`;
            if (!occupiedMap.has(key)) {
                availablePositions.push({x, y});
            }
        }
    }
    
    // 随机选择一个可用位置作为食物
    if (availablePositions.length > 0) {
        const randomIndex = Math.floor(Math.random() * availablePositions.length);
        const newPos = availablePositions[randomIndex];
        food = { type: SPECIAL_FOOD_TYPES.NORMAL, x: newPos.x, y: newPos.y };
    } else {
        // 如果没有可用位置（极少发生），随机选择一个不是蛇头的位置
        let foodX, foodY;
        do {
            foodX = Math.floor(Math.random() * (gridCountX - 1));
            foodY = Math.floor(Math.random() * (gridCountY - 1));
        } while (foodX === snake[0].x && foodY === snake[0].y);
        
        food = { type: SPECIAL_FOOD_TYPES.NORMAL, x: foodX, y: foodY };
    }
}

// 生成特殊食物
function generateSpecialFood(type) {
    // 计算最大坐标，确保与绘制的格子数量一致
    const gridCountX = Math.floor(canvas.width / scale / GRID_SIZE);
    const gridCountY = Math.floor(canvas.height / scale / GRID_SIZE);
    
    // 创建可用位置数组
    const availablePositions = [];
    
    // 创建一个地图标记占用的格子
    const occupiedMap = new Map();
    
    // 标记蛇占用的格子
    snake.forEach(segment => {
        const key = `${segment.x},${segment.y}`;
        occupiedMap.set(key, true);
    });
    
    // 标记普通食物占用的格子
    const foodKey = `${food.x},${food.y}`;
    occupiedMap.set(foodKey, true);
    
    // 标记陷阱占用的格子
    traps.forEach(trap => {
        trap.forEach(cell => {
            const key = `${cell.x},${cell.y}`;
            occupiedMap.set(key, true);
        });
    });
    
    // 标记其他特殊食物占用的格子
    specialFoods.forEach(food => {
        const key = `${food.x},${food.y}`;
        occupiedMap.set(key, true);
    });
    
    // 收集所有可用位置
    for (let x = 0; x < gridCountX; x++) {
        for (let y = 0; y < gridCountY; y++) {
            const key = `${x},${y}`;
            if (!occupiedMap.has(key)) {
                availablePositions.push({x, y});
            }
        }
    }
    
    // 如果有可用位置，创建特殊食物
    if (availablePositions.length > 0) {
        const randomIndex = Math.floor(Math.random() * availablePositions.length);
        const pos = availablePositions[randomIndex];
        
        const now = performance.now();
        const config = SPECIAL_FOOD_CONFIG[type];
        
        const specialFood = {
            type: type,
            x: pos.x,
            y: pos.y,
            createdAt: now,
            expiresAt: now + config.duration,
            warningAt: now + config.duration - config.warningTime
        };
        
        // 记录上次生成时间
        lastSpecialFoodSpawnTimes[type] = now;
        
        // 添加到特殊食物数组
        specialFoods.push(specialFood);
        
        console.log(`生成${type}特殊食物，将在${config.duration/1000}秒后消失`);
    }
}

// 生成陷阱 - 修改后的版本
function generateTraps() {
    // 计算最大坐标，确保与绘制的格子数量一致
    const gridCountX = Math.floor(canvas.width / scale / GRID_SIZE);
    const gridCountY = Math.floor(canvas.height / scale / GRID_SIZE);
    
    // 创建一个地图标记所有占用的位置（包括蛇、食物和现有陷阱）
    const occupiedMap = new Map();
    
    // 标记蛇占用的格子
    snake.forEach(segment => {
        const key = `${segment.x},${segment.y}`;
        occupiedMap.set(key, true);
    });
    
    // 标记食物位置
    const foodKey = `${food.x},${food.y}`;
    occupiedMap.set(foodKey, true);
    
    // 标记特殊食物位置
    specialFoods.forEach(food => {
        const key = `${food.x},${food.y}`;
        occupiedMap.set(key, true);
    });
    
    // 清空现有陷阱
    traps = [];
    
    // 根据难度级别确定陷阱数量和大小
    let trapCount = 2;  // 默认中等难度
    let gridSize = 3;   // 默认3x3网格
    let minCells = 3;   // 最少格子数
    let maxCells = 6;   // 最多格子数
    
    if (difficultyLevel === 'hard') {
        trapCount = 3;  // 困难模式下生成3个陷阱
        gridSize = 5;   // 困难模式下使用5x5网格
        minCells = 5;   // 最少格子数增加
        maxCells = 10;  // 最多格子数增加
    }
    
    for (let i = 0; i < trapCount; i++) {
        // 尝试找到一个合适的空位作为陷阱中心
        let centerX, centerY;
        let attempts = 0;
        let validCenter = false;
        
        // 尝试20次找到合适的中心位置
        while (!validCenter && attempts < 20) {
            centerX = Math.floor(Math.random() * gridCountX);
            centerY = Math.floor(Math.random() * gridCountY);
            const centerKey = `${centerX},${centerY}`;
            
            // 如果位置未被占用且不靠近蛇头（给蛇一些活动空间）
            if (!occupiedMap.has(centerKey)) {
                // 检查与蛇头的距离，不能太近
                const headDistance = Math.sqrt(
                    Math.pow(centerX - snake[0].x, 2) + 
                    Math.pow(centerY - snake[0].y, 2)
                );
                
                // 确保陷阱不会生成在蛇头附近3个格子的范围内
                if (headDistance > 3) {
                    // 检查边界：确保有足够的空间生成网格
                    const halfGrid = Math.floor(gridSize / 2);
                    if (centerX >= halfGrid && centerX < gridCountX - halfGrid && 
                        centerY >= halfGrid && centerY < gridCountY - halfGrid) {
                        validCenter = true;
                    }
                }
            }
            
            attempts++;
        }
        
        // 如果找到有效中心位置，生成随机形状的陷阱
        if (validCenter) {
            // 创建一个新的陷阱（包含多个格子）
            const newTrap = [];
            
            // 定义网格的偏移量
            const offsets = [];
            const halfGrid = Math.floor(gridSize / 2);
            
            // 根据gridSize生成偏移量数组
            for (let dx = -halfGrid; dx <= halfGrid; dx++) {
                for (let dy = -halfGrid; dy <= halfGrid; dy++) {
                    offsets.push({x: dx, y: dy});
                }
            }
            
            // 随机决定哪些格子会成为陷阱的一部分
            const cellCount = Math.floor(Math.random() * (maxCells - minCells + 1)) + minCells;
            
            // 随机打乱偏移量数组
            const shuffledOffsets = [...offsets].sort(() => Math.random() - 0.5);
            
            // 总是包含中心格子
            newTrap.push({x: centerX, y: centerY});
            const centerKey = `${centerX},${centerY}`;
            occupiedMap.set(centerKey, true);
            
            // 随机添加其他格子
            for (let j = 0; j < shuffledOffsets.length && newTrap.length < cellCount; j++) {
                const offset = shuffledOffsets[j];
                // 跳过中心格子（已添加）
                if (offset.x === 0 && offset.y === 0) continue;
                
                const newX = centerX + offset.x;
                const newY = centerY + offset.y;
                const key = `${newX},${newY}`;
                
                // 只有当位置未被占用时才添加
                if (!occupiedMap.has(key)) {
                    newTrap.push({x: newX, y: newY});
                    occupiedMap.set(key, true);
                }
            }
            
            // 如果至少有minCells个格子，添加到陷阱数组
            if (newTrap.length >= minCells) {
                traps.push(newTrap);
            }
        }
    }
    
    // 设置下一次陷阱更新时间
    trapRemovalTime = performance.now() + TRAP_REFRESH_INTERVAL;
    console.log("陷阱已生成，下次更新时间：", new Date(trapRemovalTime).toLocaleTimeString());
}

// 游戏主循环 - 处理游戏逻辑和渲染
function gameLoop(timestamp) {
    if (!gameStarted) return;
    
    // 计算自上次更新以来的时间
    const deltaTime = timestamp - lastRenderTime;
    lastRenderTime = timestamp;
    
    // 只有在游戏未暂停时才处理游戏逻辑和渲染
    if (!isPaused) {
        // 更新动画进度
        if (previousPositions.length > 0) {
            // 根据deltaTime计算动画进度增量
            const progressIncrement = deltaTime / updateInterval;
            animationProgress = Math.min(1.0, animationProgress + progressIncrement);
        }
        
        // 检查是否需要生成初始陷阱（仅在中等或困难难度且尚未生成陷阱时）
        if ((difficultyLevel === 'medium' || difficultyLevel === 'hard') && traps.length === 0 && trapRemovalTime === 0) {
            generateTraps();
            console.log("初始陷阱已生成");
        }
        
        // 检查陷阱是否需要更新（仅在中等或困难难度下）
        if ((difficultyLevel === 'medium' || difficultyLevel === 'hard') && trapRemovalTime > 0) {
            // 检查是否应该更新陷阱
            if (performance.now() >= trapRemovalTime) {
                console.log("更新陷阱，当前时间：", new Date().toLocaleTimeString());
                generateTraps(); // 生成新的陷阱
            }
        }
        
        // 检查是否需要生成特殊食物
        Object.keys(SPECIAL_FOOD_CONFIG).forEach(foodType => {
            const config = SPECIAL_FOOD_CONFIG[foodType];
            const lastSpawnTime = lastSpecialFoodSpawnTimes[foodType];
            
            // 如果从未生成过特殊食物或已经过了生成间隔
            if (lastSpawnTime === 0 || (timestamp - lastSpawnTime >= config.spawnInterval)) {
                // 检查当前是否已有该类型的特殊食物
                const exists = specialFoods.some(food => food.type === foodType);
                if (!exists) {
                    generateSpecialFood(foodType);
                }
            }
        });
        
        // 检查特殊食物是否应该消失
        const now = performance.now();
        specialFoods = specialFoods.filter(food => food.expiresAt > now);
        
        // 控制游戏逻辑更新频率
        if (timestamp - lastUpdateTime >= updateInterval) {
            lastUpdateTime = timestamp;
            updateGame(); // 处理游戏逻辑
        }
        
        // 每帧都进行渲染
        drawGame();
    }
    
    // 继续下一帧
    animationId = requestAnimationFrame(gameLoop);
}

// 游戏逻辑更新函数
function updateGame() {
    // 移动蛇
    moveSnake();
    
    // 检查碰撞
    if (checkCollision()) {
        endGame();
        return;
    }
    
    // 检查是否吃到普通食物
    if (snake[0].x === food.x && snake[0].y === food.y) {
        // 增加分数
        score += 10;
        scoreElement.textContent = score;
        
        // 显示得分提示（为普通食物添加得分提示）
        showFoodScoreIndicator(10, SPECIAL_FOOD_TYPES.NORMAL, food.x, food.y);
        
        // 不移除蛇尾，让蛇变长
        generateFood();
        
        // 播放吃食物音效
        playSound('eat');
    } 
    // 检查是否吃到特殊食物
    else {
        let ateSpecialFood = false;
        
        for (let i = 0; i < specialFoods.length; i++) {
            const specialFood = specialFoods[i];
            if (snake[0].x === specialFood.x && snake[0].y === specialFood.y) {
                // 获取特殊食物的分数
                const points = SPECIAL_FOOD_CONFIG[specialFood.type].points;
                
                // 增加分数
                score += points;
                scoreElement.textContent = score;
                
                // 显示特殊食物得分提示（在食物位置）
                showFoodScoreIndicator(points, specialFood.type, specialFood.x, specialFood.y);
                
                // 从数组中移除被吃掉的特殊食物
                specialFoods.splice(i, 1);
                
                // 不移除蛇尾，让蛇变长
                ateSpecialFood = true;
                
                // 播放吃食物音效
                playSound('eat');
                break;
            }
        }
        
        // 如果没有吃到任何食物，移除蛇尾
        if (!ateSpecialFood) {
            snake.pop();
        }
    }
}

// 绘制游戏
function drawGame() {
    // 清除画布
    ctx.clearRect(0, 0, canvas.width / scale, canvas.height / scale);
    
    // 使用缓存的网格背景
    if (!gridBackground) {
        createGridBackground();
    }
    ctx.drawImage(gridBackground, 0, 0);
    
    // 绘制蛇
    drawSnake();
    
    // 绘制食物
    drawFood();
    
    // 绘制特殊食物
    drawSpecialFoods();
    
    // 绘制陷阱
    drawTraps();
}

// 创建并缓存网格背景
function createGridBackground() {
    const gridCountX = Math.floor(canvas.width / scale / GRID_SIZE);
    const gridCountY = Math.floor(canvas.height / scale / GRID_SIZE);
    
    // 创建离屏Canvas
    gridBackground = document.createElement('canvas');
    gridBackground.width = canvas.width / scale;
    gridBackground.height = canvas.height / scale;
    const gridCtx = gridBackground.getContext('2d');
    
    // 绘制网格背景
    gridCtx.strokeStyle = 'rgba(220, 255, 220, 0.1)'; // 使用浅绿色的网格线，更符合森林主题
    gridCtx.lineWidth = 0.5;
    
    // 绘制垂直线
    for (let x = 0; x <= gridCountX; x++) {
        gridCtx.beginPath();
        gridCtx.moveTo(x * GRID_SIZE, 0);
        gridCtx.lineTo(x * GRID_SIZE, gridCountY * GRID_SIZE);
        gridCtx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= gridCountY; y++) {
        gridCtx.beginPath();
        gridCtx.moveTo(0, y * GRID_SIZE);
        gridCtx.lineTo(gridCountX * GRID_SIZE, y * GRID_SIZE);
        gridCtx.stroke();
    }
}

// 绘制食物 - 普通红色苹果
function drawFood() {
    // 添加发光效果
    ctx.shadowColor = 'rgba(255, 68, 54, 0.6)';
    ctx.shadowBlur = 15;
    
    // 增加食物大小
    const foodSize = GRID_SIZE * 1.1;
    const offset = (GRID_SIZE - foodSize) / 2;
    
    // 绘制苹果图像
    ctx.drawImage(
        appleImage,
        food.x * GRID_SIZE + offset,
        food.y * GRID_SIZE + offset,
        foodSize,
        foodSize
    );
    
    // 重置阴影效果
    ctx.shadowBlur = 0;
}

// 绘制特殊食物
function drawSpecialFoods() {
    // 当前时间
    const now = performance.now();
    
    // 遍历并绘制所有特殊食物
    specialFoods.forEach(food => {
        const config = SPECIAL_FOOD_CONFIG[food.type];
        
        // 判断是否处于警告状态（即将消失）
        const isWarning = now >= food.warningAt;
        
        // 设置发光效果
        if (isWarning) {
            // 闪烁效果 - 使用时间来创建闪烁
            const blinkRate = 200; // 闪烁速率(ms)
            const opacity = ((now % blinkRate) < (blinkRate / 2)) ? 1.0 : 0.3; 
            
            ctx.shadowColor = config.shadowColor;
            ctx.shadowBlur = 20 * opacity;
            ctx.globalAlpha = opacity;
        } else {
            ctx.shadowColor = config.shadowColor;
            ctx.shadowBlur = 15;
            
            // 为彩色苹果添加脉动效果
            if (food.type === SPECIAL_FOOD_TYPES.RAINBOW) {
                // 基于时间的脉动效果
                const pulseFactor = 0.2; // 脉动强度
                const pulseRate = 500; // 脉动速率(ms)
                const pulseScale = 1 + pulseFactor * Math.sin((now % pulseRate) / pulseRate * Math.PI * 2);
                
                ctx.shadowBlur = 15 * pulseScale;
            }
        }
        
        // 增加食物大小
        const foodSize = GRID_SIZE * 1.1;
        const offset = (GRID_SIZE - foodSize) / 2;
        
        // 绘制特殊食物图像
        ctx.drawImage(
            foodImages[food.type],
            food.x * GRID_SIZE + offset,
            food.y * GRID_SIZE + offset,
            foodSize,
            foodSize
        );
    });
    
    // 重置全局透明度和阴影效果
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
}

// 绘制蛇 - 连续渐变色
function drawSnake() {
    // 如果没有前一个位置，直接绘制当前位置
    if (previousPositions.length === 0 || animationProgress >= 1.0) {
        drawSnakeAtPositions(snake);
        return;
    }
    
    // 插值计算蛇的当前渲染位置
    const interpolatedPositions = snake.map((segment, index) => {
        // 确保有对应的前一个位置
        if (index < previousPositions.length) {
            const prev = previousPositions[index];
            return {
                x: prev.x + (segment.x - prev.x) * animationProgress,
                y: prev.y + (segment.y - prev.y) * animationProgress
            };
        }
        return segment; // 如果是新增的部分，直接使用当前位置
    });
    
    // 使用插值后的位置绘制蛇
    drawSnakeAtPositions(interpolatedPositions);
}

// 在指定位置绘制蛇
function drawSnakeAtPositions(positions) {
    // 创建蛇身体的渐变色
    const headPos = positions[0];
    const tailPos = positions[positions.length-1];
    
    const snakeGradient = ctx.createLinearGradient(
        headPos.x * GRID_SIZE,
        headPos.y * GRID_SIZE,
        tailPos.x * GRID_SIZE,
        tailPos.y * GRID_SIZE
    );
    
    // 添加多个颜色停止点，创建彩虹效果
    for (let i = 0; i < colors.length; i++) {
        const color = colors[i];
        // 增加颜色饱和度
        snakeGradient.addColorStop(i / (colors.length - 1), color);
    }
    
    // 添加发光效果
    ctx.shadowColor = isAccelerated ? 'rgba(255, 215, 0, 0.7)' : 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = isAccelerated ? 15 : 10;
    
    // 绘制蛇的身体部分 - 使用连续的路径
    ctx.fillStyle = snakeGradient;
    
    // 绘制蛇的每个部分
    positions.forEach((segment, index) => {
        // 为每个部分创建圆角矩形路径
        const x = segment.x * GRID_SIZE;
        const y = segment.y * GRID_SIZE;
        const size = GRID_SIZE - 1; // 留一点间隙，但不会断开
        const radius = 6; // 增加圆角半径
        
        ctx.beginPath();
        
        // 如果是头部，添加特殊效果
        if (index === 0) {
            // 绘制头部
            ctx.fillStyle = colors[0]; // 头部使用第一个颜色
            ctx.shadowColor = isAccelerated ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = isAccelerated ? 20 : 15;
            roundRect(ctx, x, y, size, size, radius);
            ctx.fill();
            
            // 绘制眼睛
            drawEyes(segment);
            
            // 重置填充样式为渐变
            ctx.fillStyle = snakeGradient;
            ctx.shadowBlur = isAccelerated ? 15 : 10;
        } else {
            // 绘制身体部分
            roundRect(ctx, x, y, size, size, radius);
            ctx.fill();
        }
    });
    
    // 重置阴影效果
    ctx.shadowBlur = 0;
}

// 绘制圆角矩形
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// 绘制蛇的眼睛
function drawEyes(head) {
    // 重置阴影效果
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = 'white';
    
    const eyeSize = GRID_SIZE / 4.5; // 增大眼睛尺寸
    const eyeOffset = GRID_SIZE / 4.5; // 调整眼睛位置偏移
    
    let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
    
    // 根据方向调整眼睛位置
    switch (direction) {
        case 'up':
            leftEyeX = head.x * GRID_SIZE + eyeOffset;
            leftEyeY = head.y * GRID_SIZE + eyeOffset;
            rightEyeX = head.x * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
            rightEyeY = head.y * GRID_SIZE + eyeOffset;
            break;
        case 'down':
            leftEyeX = head.x * GRID_SIZE + eyeOffset;
            leftEyeY = head.y * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
            rightEyeX = head.x * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
            rightEyeY = head.y * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
            break;
        case 'left':
            leftEyeX = head.x * GRID_SIZE + eyeOffset;
            leftEyeY = head.y * GRID_SIZE + eyeOffset;
            rightEyeX = head.x * GRID_SIZE + eyeOffset;
            rightEyeY = head.y * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
            break;
        case 'right':
            leftEyeX = head.x * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
            leftEyeY = head.y * GRID_SIZE + eyeOffset;
            rightEyeX = head.x * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
            rightEyeY = head.y * GRID_SIZE + GRID_SIZE - eyeOffset - eyeSize;
            break;
    }
    
    // 绘制眼睛
    ctx.beginPath();
    ctx.arc(leftEyeX + eyeSize / 2, leftEyeY + eyeSize / 2, eyeSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(rightEyeX + eyeSize / 2, rightEyeY + eyeSize / 2, eyeSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制瞳孔，使用深黑色
    ctx.fillStyle = '#000000';
    
    // 增加瞳孔大小
    const pupilSize = eyeSize / 3;
    
    ctx.beginPath();
    ctx.arc(leftEyeX + eyeSize / 2, leftEyeY + eyeSize / 2, pupilSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(rightEyeX + eyeSize / 2, rightEyeY + eyeSize / 2, pupilSize, 0, Math.PI * 2);
    ctx.fill();
}

// 处理键盘输入
function handleKeyPress(event) {
    // 如果游戏结束，忽略按键
    if (!gameStarted) return;
    
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction !== 'left') nextDirection = 'right';
            break;
        case ' ':
            // 空格键切换加速
            toggleAcceleration();
            break;
        case 'p':
        case 'P':
            // P键暂停/继续
            togglePause();
            break;
    }
}

// 添加触摸控制
function addTouchControls() {
    let touchStartX = 0;
    let touchStartY = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        if (!gameStarted) return;
        
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        // 需要一定的滑动距离才触发方向变化
        const minSwipeDistance = 30;
        
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipeDistance) {
            // 水平滑动
            if (dx > 0 && direction !== 'left') {
                nextDirection = 'right';
            } else if (dx < 0 && direction !== 'right') {
                nextDirection = 'left';
            }
        } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > minSwipeDistance) {
            // 垂直滑动
            if (dy > 0 && direction !== 'up') {
                nextDirection = 'down';
            } else if (dy < 0 && direction !== 'down') {
                nextDirection = 'up';
            }
        }
        
        // 更新起始点，使滑动更流畅
        touchStartX = touchEndX;
        touchStartY = touchEndY;
        
        e.preventDefault();
    }, { passive: false });
}

// 播放背景音乐
function playBackgroundMusic() {
    if (soundEnabled) {
        // 确保从头开始播放
        sounds.background.currentTime = 0;
        sounds.background.play().catch(e => console.log('背景音乐播放失败:', e));
    }
}

// 停止背景音乐
function stopBackgroundMusic() {
    if (sounds.background) {
        sounds.background.pause();
        sounds.background.currentTime = 0;
    }
}

// 开始游戏
function startGame() {
    // 重置新高分标志
    newHighScore = false;
    
    // 隐藏菜单和游戏结束界面
    hideAllScreens();
    gameElement.classList.remove('hidden');
    
    // 确保在游戏元素显示后重新调整画布大小
    setTimeout(() => {
        resizeCanvas();
        resetGame();
        
        // 设置游戏更新间隔
        updateInterval = GAME_SPEED[difficultyLevel];
        if (isAccelerated) {
            updateInterval = Math.floor(updateInterval / 2);
        }
        
        // 确保陷阱在游戏开始时被重置
        traps = [];
        trapRemovalTime = 0;
        
        // 清除特殊食物
        specialFoods = [];
        
        // 重置特殊食物生成时间
        Object.keys(lastSpecialFoodSpawnTimes).forEach(type => {
            lastSpecialFoodSpawnTimes[type] = 0;
        });
        
        // 开始游戏循环
        cancelAnimationFrame(animationId); // 取消任何现有的动画帧
        lastUpdateTime = performance.now();
        lastRenderTime = performance.now();
        gameStarted = true;
        isAccelerated = false; // 确保开始游戏时不是加速状态
        
        // 播放背景音乐
        playBackgroundMusic();
        
        // 立即开始游戏循环
        animationId = requestAnimationFrame(gameLoop);
    }, 50);
    
    // 添加移动设备全屏支持
    if (isMobileDevice()) {
        requestFullScreen();
    }
}

// 结束游戏
function endGame() {
    cancelAnimationFrame(animationId);
    gameStarted = false;
    
    // 停止背景音乐
    stopBackgroundMusic();
    
    // 隐藏加速指示器
    hideAccelerationIndicator();
    
    // 清除所有得分提示元素
    const scoreIndicators = document.querySelectorAll('.food-score-indicator');
    scoreIndicators.forEach(indicator => {
        if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    });
    
    // 检查是否是高分，如果是则添加到排行榜
    newHighScore = checkAndUpdateLeaderboard(score);
    
    // 播放游戏结束音效
    playSound('gameOver');
    
    // 清除之前可能存在的高分提示信息
    const existingMessages = gameOverElement.querySelectorAll('p');
    existingMessages.forEach(msg => {
        if (msg.textContent.includes('新高分')) {
            msg.remove();
        }
    });
    
    // 显示游戏结束界面，但保持游戏画面可见
    gameOverElement.classList.remove('hidden');
    
    // 更新最终分数
    finalScoreElement.textContent = score;
    
    // 如果是新高分，显示提示
    if (newHighScore) {
        const highScoreMessage = document.createElement('p');
        highScoreMessage.textContent = '新高分！已加入排行榜！';
        highScoreMessage.style.color = 'gold';
        highScoreMessage.style.fontWeight = 'bold';
        highScoreMessage.style.marginTop = '10px';
        highScoreMessage.style.animation = 'highlight-pulse 1.5s infinite alternate';
        gameOverElement.insertBefore(highScoreMessage, restartBtn);
    }
}

// 暂停/继续游戏
function togglePause() {
    if (!gameStarted) return;
    
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? '继续' : '暂停';
    
    // 如果暂停，隐藏加速指示器
    if (isPaused) {
        hideAccelerationIndicator();
    } else if (isAccelerated) {
        // 如果继续且处于加速状态，显示加速指示器
        showAccelerationIndicator();
    }
    
    // 暂停/继续背景音乐
    if (isPaused) {
        sounds.background.pause();
    } else if (soundEnabled) {
        sounds.background.play().catch(e => console.log('背景音乐播放失败:', e));
        
        // 恢复游戏时更新时间戳，避免暂停期间陷阱应该更新但没更新的情况
        lastUpdateTime = performance.now();
        lastRenderTime = performance.now();
    }
}

// 切换加速状态
function toggleAcceleration() {
    if (!gameStarted || isPaused) return;
    
    isAccelerated = !isAccelerated;
    
    // 更新游戏速度
    updateInterval = GAME_SPEED[difficultyLevel];
    if (isAccelerated) {
        updateInterval = Math.floor(updateInterval / 2); // 加速为原来的2倍（间隔减半）
        
        // 播放加速音效（如果有的话）
        playSound('button');
        
        // 显示加速指示器
        showAccelerationIndicator();
    } else {
        // 隐藏加速指示器
        hideAccelerationIndicator();
    }
}

// 显示加速指示器
function showAccelerationIndicator() {
    // 创建或显示加速指示器
    let indicator = document.getElementById('acceleration-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'acceleration-indicator';
        indicator.innerText = '加速中!';
        indicator.style.position = 'absolute';
        indicator.style.top = '10px';
        indicator.style.right = '10px';
        indicator.style.backgroundColor = 'rgba(255, 152, 0, 0.8)';
        indicator.style.color = 'white';
        indicator.style.padding = '5px 10px';
        indicator.style.borderRadius = '5px';
        indicator.style.fontWeight = 'bold';
        indicator.style.fontSize = '0.9rem';
        indicator.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        indicator.style.zIndex = '1000';
        indicator.style.transition = 'opacity 0.3s ease';
        indicator.style.animation = 'pulse 1s infinite alternate';
        
        // 添加CSS动画
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes pulse {
                0% { transform: scale(1); }
                100% { transform: scale(1.1); }
            }
        `;
        document.head.appendChild(style);
        
        gameElement.appendChild(indicator);
    } else {
        indicator.style.display = 'block';
        indicator.style.opacity = '1';
    }
}

// 隐藏加速指示器
function hideAccelerationIndicator() {
    const indicator = document.getElementById('acceleration-indicator');
    if (indicator) {
        indicator.style.opacity = '0';
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 300);
    }
}

// 显示设置界面
function showSettings() {
    hideAllScreens();
    settingsElement.classList.remove('hidden');
}

// 显示帮助界面
function showHelp() {
    hideAllScreens();
    helpElement.classList.remove('hidden');
}

// 显示菜单界面
function showMenu() {
    // 清除游戏循环
    cancelAnimationFrame(animationId);
    gameStarted = false;
    
    // 停止背景音乐
    stopBackgroundMusic();
    
    // 显示菜单
    hideAllScreens();
    menuElement.classList.remove('hidden');
}

// 显示排行榜界面
function showLeaderboard() {
    hideAllScreens();
    
    // 更新排行榜显示
    updateLeaderboardDisplay();
    
    leaderboardElement.classList.remove('hidden');
}

// 加载排行榜数据
function loadLeaderboard() {
    try {
        const savedData = localStorage.getItem('snakeLeaderboard');
        if (savedData) {
            leaderboardData = JSON.parse(savedData);
        } else {
            leaderboardData = [];
        }
    } catch (error) {
        console.error('无法加载排行榜数据:', error);
        leaderboardData = [];
    }
}

// 保存排行榜数据
function saveLeaderboard() {
    try {
        localStorage.setItem('snakeLeaderboard', JSON.stringify(leaderboardData));
    } catch (error) {
        console.error('无法保存排行榜数据:', error);
    }
}

// 检查并更新排行榜
function checkAndUpdateLeaderboard(currentScore) {
    // 如果分数为0，不记录
    if (currentScore === 0) return false;
    
    // 获取当前日期
    const today = new Date();
    const dateString = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
    
    // 创建新的排行榜条目
    const newEntry = {
        score: currentScore,
        date: dateString
    };
    
    // 检查是否为新高分（超过排行榜第一名）
    let isNewHighestScore = false;
    if (leaderboardData.length === 0 || currentScore > leaderboardData[0].score) {
        isNewHighestScore = true;
    }
    
    // 检查是否应该添加到排行榜（大于最后一名或排行榜未满）
    let shouldAddToLeaderboard = false;
    if (leaderboardData.length < MAX_LEADERBOARD_ENTRIES) {
        shouldAddToLeaderboard = true;
    } else if (currentScore > leaderboardData[leaderboardData.length - 1].score) {
        shouldAddToLeaderboard = true;
    }
    
    // 如果应该添加到排行榜，则进行添加
    if (shouldAddToLeaderboard) {
        // 添加新条目
        leaderboardData.push(newEntry);
        
        // 按分数降序排序
        leaderboardData.sort((a, b) => b.score - a.score);
        
        // 如果超出最大条目数，删除最后一条
        if (leaderboardData.length > MAX_LEADERBOARD_ENTRIES) {
            leaderboardData.pop();
        }
        
        // 保存排行榜
        saveLeaderboard();
    }
    
    // 只有在分数高于排行榜第一名时才返回true（表示新高分）
    return isNewHighestScore;
}

// 更新排行榜显示
function updateLeaderboardDisplay() {
    // 清空现有条目
    leaderboardEntriesElement.innerHTML = '';
    
    // 如果没有数据，显示提示信息
    if (leaderboardData.length === 0) {
        const noScores = document.createElement('div');
        noScores.className = 'no-scores';
        noScores.textContent = '还没有记录，快去创造高分吧！';
        leaderboardEntriesElement.appendChild(noScores);
        return;
    }
    
    // 添加所有条目
    leaderboardData.forEach((entry, index) => {
        const entryElement = document.createElement('div');
        entryElement.className = 'leaderboard-entry';
        
        // 高亮显示新添加的高分
        if (newHighScore && index === leaderboardData.findIndex(e => e.score === score && e.date === entry.date)) {
            entryElement.classList.add('highlight');
        }
        
        const rankElement = document.createElement('div');
        rankElement.className = 'rank';
        rankElement.textContent = `${index + 1}`;
        
        const scoreElement = document.createElement('div');
        scoreElement.className = 'score';
        scoreElement.textContent = entry.score;
        
        const dateElement = document.createElement('div');
        dateElement.className = 'date';
        dateElement.textContent = entry.date;
        
        entryElement.appendChild(rankElement);
        entryElement.appendChild(scoreElement);
        entryElement.appendChild(dateElement);
        
        leaderboardEntriesElement.appendChild(entryElement);
    });
}

// 隐藏所有界面
function hideAllScreens() {
    menuElement.classList.add('hidden');
    settingsElement.classList.add('hidden');
    helpElement.classList.add('hidden');
    gameElement.classList.add('hidden');
    gameOverElement.classList.add('hidden');
    leaderboardElement.classList.add('hidden');
}

// 播放音效
function playSound(soundName) {
    if (soundEnabled && sounds[soundName]) {
        // 克隆音频对象以允许重叠播放（除了背景音乐）
        if (soundName !== 'background') {
            const sound = sounds[soundName].cloneNode();
            sound.volume = 0.5; // 设置音量
            sound.play().catch(e => console.log(`${soundName}音效播放失败:`, e));
        } else {
            sounds[soundName].play().catch(e => console.log('背景音乐播放失败:', e));
        }
    }
}

// 移动蛇
function moveSnake() {
    // 保存前一个位置用于动画
    previousPositions = snake.map(segment => ({...segment}));
    
    // 更新方向
    direction = nextDirection;
    
    // 根据方向计算新的头部位置
    const head = { ...snake[0] };
    
    switch (direction) {
        case 'up':
            head.y -= 1;
            break;
        case 'down':
            head.y += 1;
            break;
        case 'left':
            head.x -= 1;
            break;
        case 'right':
            head.x += 1;
            break;
    }
    
    // 添加新的头部
    snake.unshift(head);
    
    // 重置动画进度
    animationProgress = 0;
}

// 检查碰撞
function checkCollision() {
    const head = snake[0];
    // 计算最大坐标，确保与绘制的格子数量一致
    const gridCountX = Math.floor(canvas.width / scale / GRID_SIZE);
    const gridCountY = Math.floor(canvas.height / scale / GRID_SIZE);
    
    // 检查墙壁碰撞
    if (head.x < 0 || head.x >= gridCountX || head.y < 0 || head.y >= gridCountY) {
        return true;
    }
    
    // 检查自身碰撞（从第二个身体部分开始检查）
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    // 检查陷阱碰撞
    for (let i = 0; i < traps.length; i++) {
        for (let j = 0; j < traps[i].length; j++) {
            if (head.x === traps[i][j].x && head.y === traps[i][j].y) {
                return true;
            }
        }
    }
    
    return false;
}

// 绘制陷阱
function drawTraps() {
    // 检查陷阱是否快要消失
    const timeRemaining = trapRemovalTime - performance.now();
    const isFlashing = timeRemaining > 0 && timeRemaining < 1000; // 最后1秒闪烁
    const opacity = isFlashing ? 0.3 + 0.7 * Math.sin(performance.now() / 100) : 1.0; // 闪烁效果
    
    // 添加发光效果
    ctx.shadowColor = difficultyLevel === 'hard' ? 'rgba(255, 0, 0, 0.6)' : 'rgba(100, 100, 100, 0.6)';
    ctx.shadowBlur = difficultyLevel === 'hard' ? 8 : 5;
    
    // 遍历所有陷阱
    traps.forEach(trap => {
        // 每个陷阱是一个格子数组
        trap.forEach(cell => {
            // 保存当前绘图上下文
            ctx.save();
            
            // 设置透明度（闪烁效果）
            if (isFlashing) {
                ctx.globalAlpha = opacity;
            }
            
            // 在困难模式下修改陷阱外观
            if (difficultyLevel === 'hard') {
                // 绘制更危险的陷阱（红色版本）
                ctx.fillStyle = '#a62222'; // 深红色
                ctx.beginPath();
                ctx.arc(
                    cell.x * GRID_SIZE + GRID_SIZE/2,
                    cell.y * GRID_SIZE + GRID_SIZE/2,
                    GRID_SIZE/2 - 1,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
                
                // 加上锯齿边缘
                ctx.fillStyle = '#730000'; // 更深的红色
                const spikes = 8; // 锯齿数量
                const innerRadius = GRID_SIZE/3;
                const outerRadius = GRID_SIZE/2 - 1;
                
                ctx.beginPath();
                for (let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (Math.PI * 2 * i) / (spikes * 2);
                    const x = cell.x * GRID_SIZE + GRID_SIZE/2 + radius * Math.cos(angle);
                    const y = cell.y * GRID_SIZE + GRID_SIZE/2 + radius * Math.sin(angle);
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.fill();
                
                // 添加警示标记
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(cell.x * GRID_SIZE + GRID_SIZE/2, cell.y * GRID_SIZE + GRID_SIZE/4);
                ctx.lineTo(cell.x * GRID_SIZE + GRID_SIZE/2, cell.y * GRID_SIZE + GRID_SIZE*3/4);
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(cell.x * GRID_SIZE + GRID_SIZE/2, cell.y * GRID_SIZE + GRID_SIZE*3/4 + 2, 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // 绘制普通陷阱图像
                ctx.drawImage(
                    trapImage,
                    cell.x * GRID_SIZE,
                    cell.y * GRID_SIZE,
                    GRID_SIZE,
                    GRID_SIZE
                );
            }
            
            // 恢复绘图上下文
            ctx.restore();
            
            // 绘制连接线，使陷阱看起来更加连贯
            if (difficultyLevel === 'hard') {
                ctx.strokeStyle = `rgba(255, 50, 50, ${opacity * 0.6})`;
            } else {
                ctx.strokeStyle = `rgba(100, 100, 100, ${opacity * 0.4})`;
            }
            ctx.lineWidth = difficultyLevel === 'hard' ? 3 : 2;
            
            // 检查相邻的陷阱格子并绘制连接线
            trap.forEach(neighbor => {
                // 如果是相邻的格子（上下左右），绘制连接线
                const isAdjacent = (
                    (Math.abs(cell.x - neighbor.x) === 1 && cell.y === neighbor.y) || 
                    (Math.abs(cell.y - neighbor.y) === 1 && cell.x === neighbor.x)
                );
                
                if (isAdjacent) {
                    ctx.beginPath();
                    ctx.moveTo(
                        cell.x * GRID_SIZE + GRID_SIZE / 2,
                        cell.y * GRID_SIZE + GRID_SIZE / 2
                    );
                    ctx.lineTo(
                        neighbor.x * GRID_SIZE + GRID_SIZE / 2,
                        neighbor.y * GRID_SIZE + GRID_SIZE / 2
                    );
                    ctx.stroke();
                }
            });
        });
    });
    
    // 重置阴影效果
    ctx.shadowBlur = 0;
}

// 修改为统一的得分提示函数（替换原来的showSpecialFoodScoreIndicator函数）
function showFoodScoreIndicator(points, foodType, foodX, foodY) {
    // 如果游戏暂停或结束，不显示得分提示
    if (isPaused || !gameStarted) {
        return;
    }
    
    // 创建新的得分指示器元素，而不是重用现有的
    const indicator = document.createElement('div');
    indicator.className = 'food-score-indicator';
    indicator.style.position = 'absolute';
    indicator.style.fontWeight = 'bold';
    indicator.style.zIndex = '1000';
    indicator.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)';
    indicator.style.pointerEvents = 'none'; // 防止干扰点击
    indicator.style.fontSize = '1.5rem';
    indicator.style.transition = 'all 0.8s ease';
    indicator.style.opacity = '0';
    gameElement.appendChild(indicator);
    
    // 根据食物类型设置颜色
    let color;
    switch (foodType) {
        case SPECIAL_FOOD_TYPES.NORMAL:
            color = '#F44336'; // 红色苹果
            break;
        case SPECIAL_FOOD_TYPES.ORANGE:
            color = '#FF9800';
            break;
        case SPECIAL_FOOD_TYPES.PURPLE:
            color = '#9C27B0';
            break;
        case SPECIAL_FOOD_TYPES.RAINBOW:
            color = 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)';
            break;
        default:
            color = 'white';
    }
    
    // 设置颜色和文本
    indicator.style.color = color;
    if (foodType === SPECIAL_FOOD_TYPES.RAINBOW) {
        indicator.style.background = color;
        indicator.style.webkitBackgroundClip = 'text';
        indicator.style.backgroundClip = 'text';
        indicator.style.color = 'transparent';
    } else {
        indicator.style.background = 'none';
        indicator.style.webkitBackgroundClip = 'none';
        indicator.style.backgroundClip = 'none';
        indicator.style.color = color;
    }
    
    // 设置内容和初始位置（基于食物的位置）
    indicator.textContent = `+${points}`;
    
    // 将游戏内坐标转换为屏幕像素
    const pixelX = (foodX * GRID_SIZE) + (GRID_SIZE / 2);
    const pixelY = (foodY * GRID_SIZE) + (GRID_SIZE / 2);
    
    // 设置指示器在食物位置
    indicator.style.left = `${pixelX}px`;
    indicator.style.top = `${pixelY}px`;
    indicator.style.transform = 'translate(-50%, -50%)';
    
    // 确保CSS动画定义存在
    ensureAnimationStyleExists();
    
    // 应用上升动画
    indicator.style.animation = 'score-float 1.2s ease-out forwards';
    indicator.style.opacity = '1';
    
    // 动画结束后移除元素
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }, 1500);
}

// 确保CSS动画定义已添加到文档
function ensureAnimationStyleExists() {
    // 检查是否已经添加了动画样式
    if (!document.getElementById('score-animation-style')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'score-animation-style';
        styleSheet.textContent = `
            @keyframes score-float {
                0% {
                    transform: translate(-50%, -50%) scale(0.5);
                    opacity: 0;
                }
                20% {
                    transform: translate(-50%, -50%) scale(1.2);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -100%) scale(1);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }
}

// 保留原来的showSpecialFoodScoreIndicator函数名，但改为调用新函数，以保持兼容性
function showSpecialFoodScoreIndicator(points, foodType) {
    // 由于没有位置信息，默认显示在屏幕中央
    const centerX = Math.floor(canvas.width / scale / GRID_SIZE / 2);
    const centerY = Math.floor(canvas.height / scale / GRID_SIZE / 2);
    showFoodScoreIndicator(points, foodType, centerX, centerY);
}

// 当窗口大小变化时，清除网格背景缓存
window.addEventListener('resize', () => {
    gridBackground = null;
});

// 初始化游戏
window.addEventListener('load', initGame); 

// 判断是否为移动设备
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 请求全屏
function requestFullScreen() {
    var element = document.documentElement;
    
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

// 退出全屏
function exitFullScreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
}
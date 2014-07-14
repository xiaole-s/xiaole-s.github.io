//version: xiaole-s 2048 v0.0.2 rewrite oop
//author: xiaole(lianle.shi)

//设计只创建一个scene
xls = {};
xls.Game2048 = (function () {
    //私有静态变量
    var LEVELS = [[256, 8, 3], [1024, 8, 3], [512, 4, 2], [2048, 4, 2], [8192, 8, 4], [4096, 4, 2], [8192, 4, 2]],
        game = 2048,
        n_n = 4,        //n*n 矩阵
        nB = 2,         //new block每次产生数
        nD = null,      //now direction用户操作当前方向
        score = 0,
        level = 3,      //当前等级
        lvlis = [],     //难度等级选项
        colors = null,  //滑块颜色取值数组
        blockWH = 0,    //滑块高宽
        blockGap = 0,   //滑块间隔
        blockList = [],//滑块列表
        sceneWH,
        self = null,    //把Game2048的对象的this带出来

        slideBlockArray,//GAME游戏算法的数据结构数组
        emptyBlockArray,//维护没有block的位置的数组

        scoreEle = document.getElementById("score"),
        sceneEle = document.getElementById("scene"),
        gameNameEle = document.getElementById("game-name"),
        animaSwitchEle = document.getElementById("anima-switch"),
        animaSwitch = animaSwitchEle.checked = true;    //动画开关

    //动画开关控制
    animaSwitchEle.onchange = function () {
        animaSwitch = animaSwitchEle.checked;
    };

    //对数求值
    function log(n, m, k) {
        if (m <= n) return k;
        if (k > 100) return 0;
        return log(n, m / 2, ++k);
    }
    //矩阵方法 用于处理上下左右的操作变化
    Matrix = {
        //矩阵转置
        //|2 0 0 0|    |2 2 2 2|
        //|2 0 0 0|    |0 0 4 8|
        //|2 4 4 0| -> |0 0 4 0|
        //|2 8 0 0|    |0 0 0 0|
        transposition: function (a) {
            for (var i = 0, t = 0; i < n_n; i++) {
                for (var j = i + 1; j < n_n; j++) {
                    t = a[i][j];
                    a[i][j] = a[j][i];
                    a[j][i] = t;
                }
            }
            return a;
        },
        //矩阵镜像
        //|2 0 0 0|    |0 0 0 2|
        //|2 0 0 0|    |0 0 0 2|
        //|2 4 8 0| -> |0 8 4 2|
        //|2 8 0 0|    |0 0 8 2|
        mirror: function (a) {
            for (var i = 0, t = 0, len = n_n / 2; i < n_n; i++) {
                for (var j = 0; j < len; j++) {
                    t = a[i][j];
                    a[i][j] = a[i][n_n - j - 1];
                    a[i][n_n - j - 1] = t;
                }
            }
            return a;
        },
        //矩阵镜像 需要预先排除空域
        //|2 4 8 4|    |4 8 8 2|
        //|2 4 0 0|    |4 2 0 0|
        //|2 4 8 0| -> |8 4 2 0|
        //|2 8 0 0|    |8 2 0 0|
        mirror2: function (a) {
            for (var i = 0; i < n_n; i++) {
                for (var j = 0, len = n_n - a[i].length; j < len; j++) {
                    a.unshift(undefined);
                }
            }
        }
    }

    //滑块pos=[x,y]
    function SlideBlock(pos, value, ele) {
        this.pos = pos;
        this.value = value;
        this.ele = ele || document.createElement("div");
        this.init();
    }
    SlideBlock.prototype = {
        init: function () {
            this.ele.className = "block";
        }
    }

    function setGameName(name) {
        gameNameEle.innerHTML = name;
    }

    function setScore(numb) {
        score = numb;
    }
    function clearScene(ele) {
        //scene.innerHTML = "";//场景清空
        ele && scene.removeChild(ele);
    }
    function Game2048(name, n, nb, sc, clrs, wh) {
        //只用初始化一次的
        self = this;
        n_n = n || n_n;
        score = sc || score;
        game = name || game;
        nB = nb || nB;//new block
        this.colors = clrs || [];
        sceneWH = wh > 500 ? 500 : wh || 450;
        scene.style.width = scene.style.height = sceneWH + "px";

        levelManager();
        this.init();
    };

    Game2048.prototype = {
        init: function () {//需要清空的
            //背景初始化

            //数据准备
            score = 0;
            //blockList = []; //初始化/复位存储滑块的位置
            blockWH = Math.floor(sceneWH / (n_n + 1));//多出来的一块用作间隔
            blockGap = Math.floor(blockWH / (n_n + 1));
            slideBlockArray = this.makeBlockArray();//维护滑块的数据结构数组
            //初始化滑块颜色值
            var tt = log(2, game, 1);
            colors = this.colors;
            colors[tt] || (colors = (function () {
                var clrs = [];//100+tc*15  //tc*20
                for (var i = tt; i > 0; i--) {
                    clrs[i] = ("rgba(" + Math.round(i * 255 / tt) + "," +
                                Math.round((i - 2) * 255 / tt) + ",0,.9)");
                }
                return clrs;
            })());
            
            //结构清理
            setGameName(game);
            setScore(score);
            //this.getFullPanel().removePanel();
            blockList[0] && clearScene(blockList[0].parentElement);
            blockList = []; //初始化/复位存储滑块的位置
            this.getFullPanel().init();//消息面板

            var ul = document.createElement("ul");
            ul.className = "block-list-bg";
            ul.style.height = ul.style.width = (blockWH + blockGap) * n_n + blockGap + "px";
            for (var i = 0, len = n_n * n_n; i < len; i++) {
                var li = document.createElement("li");
                li.style.height = li.style.width = blockWH + "px";
                li.style.marginTop = li.style.marginLeft = blockGap + "px";
                li.style.fontSize = (50 * 4 / n_n) + "px";
                blockList.push(li);
                ul.appendChild(li);
            }
            scene.insertBefore(ul, this.getFullPanel().getPanel());
            //this.getFullPanel().init();//消息面板
            //blockList[0].parentElement
            //this.newBlock();
            this.updateScene();
        },
        setLevel: function (lv) {
            level = lv;
        },
        getLevel: function () {
            return level;
        },
        levelUpdateData: function () {
            var a = LEVELS[level];
            game = a[0];
            n_n = a[1];
            nB = a[2];
            this.init();
        },
        Rule: function () {

        },
        makeBlockArray: function () {
            var t = [];
            for (var i = 0; i < n_n; i++) {
                t.push(new Array());
            }
            return t;
        },
        cloneBlockArray: function (a) {
            var b = this.makeBlockArray();
            for (var i = 0; i < n_n; i++) {
                for (var j = 0; j < n_n; j++) {
                    b[i][j] = a[i][j];
                }
            }
            return b;
        },
        getFullPanel: (function () {
            var _instance = null;
            function Singleton() {
                this.panel = document.createElement("div");
                this.init();
            }
            Singleton.prototype = {
                init: function () { this.panel.innerHTML = ""; this.panel.className = "full-scene"; },
                getPanel: function () { return this.panel; },
                removePanel: function () { this.panel.parentNode.removeChild(this.panel);},
                setMsg: function (str) { this.panel.innerHTML = str; },
                getMsg: function () { return this.panel.innerHTML.toString(); },
                addClass: function (str) { this.panel.className = "full-scene " + str; }//@+检查class str是否存在
            };
            return (function () {
                if (!_instance) {
                    _instance = new Singleton();
                    scene.appendChild(_instance.getPanel());
                }
                return _instance;
            });
        })(),
        gameover: function () {
            this.getFullPanel().init();
            this.getFullPanel().setMsg("Game Over!!");
            this.getFullPanel().addClass("gameover");
        },
        win: function () {
            this.getFullPanel().init();
            this.getFullPanel().setMsg("You Win!!");
            this.getFullPanel().addClass("win");
            setTimeout(function () {
                if (confirm("恭喜进入下一关!!")) {
                    //alert(lvlis[++level]);
                    lvlis[++level].click();
                }
            }, 1000);
        },
        message: function (str) {
            this.getFullPanel().init();
            this.getFullPanel().setMsg(str);
            this.getFullPanel().addClass("msg");
        },
        meetRule: function (r) {
            return r != undefined && r != 0;
        },
        animation: function () {
            var t = blockGap + blockWH, w = 0;
            for (var i = 0; i < n_n; i++) {
                for (var j = 0, len = slideBlockArray[i].length; j < len; j++) {
                    var a = slideBlockArray[i][j];
                    if (a != undefined) {
                        var ele = slideBlockArray[i][j].ele;//blockList[a.pos[0]*n_n+a.pos[1]].getElementsByTagName("div")[0];//
                        if (ele instanceof HTMLElement) {
                            switch (nD) {
                                case "u":
                                case "d":
                                    w = i - a.pos[0];//alert(w * t);                                    
                                    ele.style.top = t * w + "px"; break;
                                case "l":
                                case "r":
                                    w = j - a.pos[1];//(n_n - 1 - a.nowPos[1])
                                    ele.style.left = t * w + "px"; break;
                                default: break;
                            }
                            slideBlockArray[i][j].pos = [i, j];
                        }
                        if (!this.meetRule(slideBlockArray[i][j].value)) {
                            delete slideBlockArray[i][j];
                            slideBlockArray[i][j] = undefined;
                        }
                    }
                }
            }
        },
        printNumb: function () {
            this.newBlock();

            var a = slideBlockArray;
            for (var i = 0; i < n_n; i++) {
                for (var j = 0; j < n_n; j++) {
                    var t = a[i][j],
                        idx = i * n_n + j;
                    if (t && this.meetRule(t.value)) {
                        var tc = log(t.value, game, 1),
                            div = a[i][j].ele = document.createElement("div");//=
                        div.className = "block";
                        div.style.backgroundColor = colors[tc];
                        div.innerHTML = t.value.toString();
                        //div.appendChild(document.createTextNode(t.value));
                        blockList[idx].innerHTML = "";
                        blockList[idx].appendChild(div);
                    }
                    else {
                        blockList[idx].innerHTML = "";
                    }
                }
            }
            scoreEle.innerHTML = "score:" + score;
        },
        updateScene: function () {
            if (animaSwitch) {
                this.animation();
                //var self = this;
                //setTimeout中this是window
                setTimeout(function () {
                    self.printNumb();
                }, 500);
                return true;
            }
            //alert("error!");
            this.printNumb();
        },
        //清除不符合规定的块
        //|0 0 0 0|  |0 0 0 0| 
        //|0 2 2 0|  |2 2 0 0|
        //|0 0 0 2|->|2 0 0 0|
        //|2 0 0 0|  |2 0 0 0|
        excludeByRule: function (a) {
            var tempArray = this.makeBlockArray(),
                t = 0;
            emptyBlockArray = [];
            for (var i = 0; i < n_n; i++) {
                for (var j = 0; j < n_n; j++) {
                    t = a[i][j];
                    (t && this.meetRule(t.value) && tempArray[i].push(t)) ||
                                            emptyBlockArray.push(i * n_n + j);//空块索引
                }
            }
            return tempArray;
        },
        //添加新块
        newBlock: function () {
            this.excludeByRule(slideBlockArray);
            var len = emptyBlockArray.length;

            for (var i = 0; i < len && i < nB; i++) {
                var m = emptyBlockArray[Math.floor(Math.random() * len - .01)],
                    x = Math.floor(m / n_n),
                    y = m % n_n;
                //产生新块数据
                slideBlockArray[x][y] = new SlideBlock([x, y], Math.random() > 0.9 ? 4 : 2, null)
            }
            //检测slideBlockArray是否已满且不可合并
            (2 > len) && !this.checkUDLR(slideBlockArray) && this.gameover();

            //this.updateScene();
        },
        merge: function () {
            //清除空快
            slideBlockArray = this.excludeByRule(slideBlockArray);

            for (var i = 0; i < n_n; i++) {
                for (var j = 1, len = slideBlockArray[i].length; j < len; j++) {
                    var a = slideBlockArray[i][j - 1].value,
                        b = slideBlockArray[i][j].value, t;
                    if (this.meetRule(a) && this.meetRule(b) && parseInt(a) == parseInt(b)) {
                        t = a * 2;
                        slideBlockArray[i][j].value = t;
                        score += t;
                        //alert(slideBlockArray[i][j-1]);
                        slideBlockArray[i][j - 1].value = undefined;
                        (game == t) && this.win();
                        j++;
                    }
                }
            }
            //清除空快
            slideBlockArray = this.excludeByRule(slideBlockArray);
        },
        //检测上下左右是否还有可合并的块
        checkUDLR: function (a) {
            var bb = false;
            for (var i = 0, len = n_n - 1; i < len && !bb; i++) {
                for (var j = 0; j < len; j++) {//左上角n_n-1 * n_n-1
                    if (a[i][j].value == a[i][j + 1].value || a[i + 1][j].value == a[i][j].value) {
                        bb = true;
                        break;
                    }
                }
                //右下角 n_n * n_n
                if (a[len][i].value == a[len][i + 1].value || a[i][len].value == a[i + 1][len].value) {
                    bb = true;
                    break;
                }
            }
            return bb;
        },
        //左合并 左合并与二位数组结构一致不需变换
        leftMerge: function () {
            this.merge();
            //this.newBlock();
            this.updateScene();
        },
        //上合并
        upMerge: function () {
            slideBlockArray = Matrix.transposition(slideBlockArray);
            this.merge();
            slideBlockArray = Matrix.transposition(slideBlockArray);
            //this.newBlock();
            this.updateScene();
        },
        //右合并 
        rightMerge: function () {
            slideBlockArray = Matrix.mirror(slideBlockArray);
            this.merge();
            slideBlockArray = Matrix.mirror(slideBlockArray);
            //this.newBlock();
            this.updateScene();
        },
        //下合并
        downMerge: function () {
            slideBlockArray = Matrix.transposition(slideBlockArray);
            slideBlockArray = Matrix.mirror(slideBlockArray);
            this.merge();
            slideBlockArray = Matrix.mirror(slideBlockArray);
            slideBlockArray = Matrix.transposition(slideBlockArray);
            //this.newBlock();
            this.updateScene();
        }
    }

    /************************事件响应************************/
    window.onkeypress = function (e) {
        switch (e.keyCode) {//左上右下
            case 37:
            case 97:
            case 65: nD = "l"; self.leftMerge(); break;
            case 38:
            case 119:
            case 87: nD = "u"; self.upMerge(); break;
            case 39:
            case 100:
            case 68: nD = "r"; self.rightMerge(); break;
            case 40:
            case 83:
            case 115: nD = "d"; self.downMerge(); break;
            default:
                alert("请使用如下按键控制滑块移动\n 上：w\n 下：s\n 左：a\n 右：d\n" +
                      "尽可能使相同的滑块碰撞使滑块上的数字变大\n" +
                      "直到" + self.GAME + " 进入下一关, 同时使分数尽可能的高。\n");
                break;
        }
    }

    function levelManager() {
        function liNav(nav) {
            this.nav = nav;
            this.init();//对每一个对象都要不同的初始化
        }
        liNav.prototype.init = function () {
            var cur = self.getLevel();
            lvlis = [].slice.call(this.nav.querySelectorAll("li"));
            //game.levelUpdateData();
            lvlis.forEach(function (li, idx) {
                li.addEventListener("click", function (e) {
                    e.preventDefault();
                    if (cur !== idx || self.getFullPanel().getMsg() != "") {
                        lvlis[cur].removeAttribute('class');
                        li.className = 'current';
                        self.setLevel(cur = idx);
                        //alert(game.getLevel());
                        self.levelUpdateData();
                    }
                });
            });
        }
        window.liNav = liNav;

        [].slice.call(document.querySelectorAll('.dotstyle > ul')).forEach(function (nav) {
            new liNav(nav);
        })
    }
    

    return Game2048;
})();


(function () {
    clrs = [, "rgba(238,196,0,1)", "rgba(238,186,19,1)", "rgba(238,196,45,1)",
                 "rgba(238,208,75,1)", "rgba(238,216,98,1)", "rgba(238,170,15,1)",
                 "rgba(238,140,15,1)", "rgba(238,124,95,1)", "rgba(236,141,84,1)",
                 "rgba(238,177,121,1)", "rgba(220,205,173,1)", "rgba(230,225,203,1)"];
    var game = new xls.Game2048(2048, 4, 2, 100, clrs, 450);

    
})();

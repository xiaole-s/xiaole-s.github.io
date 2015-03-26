/// <reference path="jquery.js" />


!(function ($) {
    
    xls = window.xls || {};

    xls.Calendar = (function () {
        /*
         * 已知用户设置周开始为星期m，计算出当前月的第一天是星期n，则p=n>=m?n-m:7-(m-n)是上一月剩下的天数class="null"
         * 已知用户设置周开始为星期m，计算出当前月的最后一天是星期n，则p=n>=m?7-(n-m)-1:m-n-1是下一月开始的天数class="null"
         * 一个月应当具备属性
         */
        /*
         *Month = {
         *    year: 2014,
         *    month: 8,
         *    curDay: 9,
         *    firstDay: { day: 1, week: 5 }, //[1, 5] 1号 星期5
         *    lastDay: {day:31, week:0}, //[31, 0] 31号 星期日
         *}
         */
        function Month(date) {
            this.date = date;
            //this.data = {};

            //this.nextMonth = this.preMonth = null;
            this.init();

        }

        Month.prototype = {
            init: function () {
                var data = this.data = {},

                    tempDate = new Date(this.date);
                //当前日期
                data.year = tempDate.getFullYear();
                data.month = tempDate.getMonth();
                //data.curDay = tempDate.getDate();
                //当前天
                data.firstDayWeek = tempDate.setDate(1) && tempDate.getDay();
                //第一天的星期 tempDate=本月第一天
                data.lastDay = (tempDate.setMonth(data.month + 1) && tempDate.setDate(0) && tempDate.getDate());
                //最后一天 tempDate=下月第一天->本月最后一天->获取日期
                data.lastDayWeek = tempDate.getDay();
                //最后一天的星期
            },
            getPreMonth: function () {
                var tempDate = new Date(this.date);
                //为了不修改玩不传入的date浪费了一个临时的date
                tempDate.setMonth(this.data.month - 1);

                return this.preMonth = new Month(tempDate);
            },
            getNextMonth: function () {
                var tempDate = new Date(this.date);
                //为了不修改玩不传入的date浪费了一个临时的date
                tempDate.setMonth(this.data.month + 1);

                return this.nextMonth = new Month(tempDate);
            },
            getPreDayCount: function (m) {
                var n = this.data.firstDayWeek;
                m = m || (m == 0 ? 0 : 1);
                //默认星期一
                return (n >= m ? n - m : 7 - (m - n));
            },
            getNextDayCount: function (m) {
                var n = this.data.lastDayWeek;
                //console.log("n="+n);
                m = m || (m == 0 ? 0 : 1);
                //默认星期一
                //console.log("m=" + m);

                return (n >= m ? 7 - (n - m) - 1 : m - n - 1);
            },
            getPreExsertedDay:function(flag, ws){
                var preMonth = this.preMonth || this.getPreMonth(),
                    preDC = this.getPreDayCount(ws),
                    days = [];
                //上月
                var yy = preMonth.data.year, mm = preMonth.data.month, ld = preMonth.data.lastDay, dd = ld - preDC + 1;
                while (ld >= dd) {
                    days.push([flag, yy + "-" + (mm + 1) + "-" + dd, dd]);
                    dd++;
                }
                return days;
            },
            getCurMonthDay:function(){//当前月
                var days = [],
                    thisDC = this.data.lastDay;
                yy = this.data.year; mm = this.data.month; dd = 1;
                var wd = this.data.firstDayWeek;
                while (thisDC >= dd) {
                    days.push([wd, yy + "-" + (mm + 1) + "-" + dd, dd]);
                    wd = ++wd % 7;
                    dd++;
                }
                return days;
            },
            getNextExsertedDay: function (flag, ws) {//下月
                var nextMonth = this.nextMonth || this.getNextMonth(),
                    nextDC = this.getNextDayCount(ws),
                    days = [];
                
                yy = nextMonth.data.year; mm = nextMonth.data.month; dd = 1;
                while (nextDC >= dd) {
                    days.push([flag, yy + "-" + (mm + 1) + "-" + dd, dd]);
                    dd++;
                }
                return days;
            },
            getAllDayOfMonth: function (ws) {
                return this.monthDays = this.getPreExsertedDay(7, ws).concat(this.getCurMonthDay(), this.getNextExsertedDay(7, ws));
            },
            getAllDayOfMonth2: function (ws) {
                this.getPreMonth();
                this.getNextMonth();
                var monthDays = [],
                    //curDay = this.data.curDay,
                    preDC = this.getPreDayCount(ws),
                    thisDC = this.data.lastDay,
                    nextDC = this.getNextDayCount(ws),
                    preMonth = this.preMonth,
                    nextMonth = this.nextMonth;

                //上月
                var yy = preMonth.data.year, mm = preMonth.data.month, ld = preMonth.data.lastDay, dd = ld - preDC + 1;
                while (ld >= dd) {
                    monthDays.push([7, yy + "-" + (mm + 1) + "-" + dd, dd]);
                    dd++;
                }

                //当前月
                yy = this.data.year; mm = this.data.month; dd = 1;
                //var wd = 6 - this.data.firstDayWeek;//第一个周六
                //wd = (wd == 6 ? dd-1 : wd + dd);
                //第一个周末的日过第一天是星期日需要将wd设为第一天的前一天
                var wd = this.data.firstDayWeek;
                while (thisDC >= dd) {
                    /*if (dd == wd) {//周末
                        monthDays.push([2, yy + "-" + (mm + 1) + "-" + dd, dd]);
                    }
                    else if (dd == wd+1) {
                        monthDays.push([2, yy + "-" + (mm + 1) + "-" + dd, dd]);
                        wd += 7;
                    }
                    else {
                        monthDays.push([1, yy + "-" + (mm + 1) + "-" + dd, dd]);
                    }
                    */
                    monthDays.push([wd, yy + "-" + (mm + 1) + "-" + dd, dd]);

                    wd = ++wd % 7;
                    dd++;
                }

                //下月
                yy = nextMonth.data.year; mm = nextMonth.data.month; dd = 1;
                while (nextDC >= dd) {
                    monthDays.push([7, yy + "-" + (mm + 1) + "-" + dd, dd]);
                    dd++;
                }

                return this.monthDays = monthDays;
            },
            format: function (type) {
                var re = [], md = this.monthDays || [];
                switch (type) {
                    case 'weeks7':
                        for (var i = 0, len = md.length; i < len; i += 7) {
                            re.push(md.slice(i, 7 + i));
                        }
                        break;
                    default: break;
                }

                return re;
            },
            formatForever: function (type) {
                var re = [], md = this.monthDays || [];
                switch (type) {
                    case 'weeks7':
                        while (md.length != 0) {
                            re.push(md.splice(0, 7));
                        };
                        break;
                    default: break;
                }

                return this.monthDays = re;
            },
            getMonthDays: function (ws) {
                return this.monthDays || this.getAllDayOfMonth(ws);
            }
        }

        /*//测试
        !(function () {
            var d = new Date(),
                ws = 1;
            M = new Month(d),
            //pass
            //curDay = M.data.curDay;
            M.getAllDayOfMonth(ws);
            //pass
            for (var i = 0; i < 8; i++) {
                var data = daterMap({
                    year: M.data.year + '年',       //pass
                    month: M.data.month + 1 + '月', //pass
                    weekStart: ws,                  //pass
                    weekStyle: weekMap.sc,              //pass
                    weeks: M.format('weeks7')       //pass
                })
                M = M.nextMonth;                    //pass
                M.getAllDayOfMonth(ws);

                document.body.getElementsByClassName('calendar-wrap')[0].appendChild(data);
            }

        }())
        //*/
        /*function displayStyle(style) {
            return {
                //简体中文
                sc: { weekMap: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"], year: '年', month: '月', day: '日'},
                sc2: {weekMap: ["日", "一", "二", "三", "四", "五", "六"], year: '年', month: '月', day: '日'},
                //English
                en: { weekMap: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], year: ' ', month: ' ', day: ' '},
                en2: {weekMap: ["S", "M", "T", "W", "T", "F", "S"], year: ' ', month: ' ', day: ' '}
            }[style];
        }//*/
        
        /*
         * Calendar
         * ws:weekStart
         * ds:displayStyle
         * ms:monthStart
         * mc:monthCount
         */
        function Calendar(ws, ds, ms, mc, ci, co) {
            this.weekStart = ws;
            this.displayStyle = ds;//displayStyle(ds || 'sc');

            this.monthStart = ms || new Date();
            this.monthCount = mc || 5;
            this.curDay = (new Date()).getDate();

            this.checkInDay = ci || [];//[6, 2014-8-9, 9]
            this.checkOutDay = co || [];//[0, 2014-8-10, 10]
            this.monthArray = [];
            this.init();
        }

        Calendar.prototype = {
            init: function () {
                var M = new Month(this.monthStart);
                for (var i = 0; i < this.monthCount; i++) {
                    this.monthArray.push(M);
                    M.getAllDayOfMonth(this.weekStart);
                    M = M.getNextMonth();
                }
            },
            setDisableAntique: function (date, flag) {
                var cy = date.getFullYear(),
                    cm = date.getMonth(),
                    cd = date.getDate(),
                    ma = this.monthArray;
                for (var i = 0, len = ma.length; i < len; i++) {
                    var data = ma[i].data;
                    if (data.year <= cy && data.month <= cm) {
                        if (data.month == cm) {
                            for (var j = ma[i].getPreDayCount(this.weekStart), len = cd + j - 1; j < len; j++) {
                                ma[i].monthDays[j][0] = flag[0];
                            }
                            //ma[i].monthDays[len][0] = flag[1];
                            ma[i].monthDays[len][2] = '今天'//flag[1][1];
                        } else {
                            for (var j = ma[i].getPreDayCount(this.weekStart), len = j + data.lastDay; j < len; j++) {
                                ma[i].monthDays[j][0] = flag[0];
                            }
                        }
                    } else {
                        break;
                    }
                }
            },
            display: function (daterHead, daterBody) {//回调从Calendar类中移除格式部分代码
                this.setDisableAntique(new Date(), [8, 9]);
                var div = document.createElement("div");
                div.className = "calendar-wrap";
                var ma = this.monthArray,
                    style = this.displayStyle,
                    self = this,
                    html = daterHead([[self.checkInDay[1], style.weekMap[self.checkInDay[0]]],
                                    [self.checkOutDay[1], style.weekMap[self.checkOutDay[0]]]]);
                
                for (var i = 0, len = ma.length; i < len; i++) {
                    var data = ma[i].data;
                    //月份迭代
                    html += daterBody({
                        year: data.year + style.year,
                        month: data.month + 1 + style.month,
                        weekStart: self.weekStart,
                        weekStyle: style.weekMap,
                        weeks:ma[i].getMonthDays(self.weekStart) && ma[i].format("weeks7")
                    })
                }
                div.innerHTML = html;

                document.body.getElementsByClassName('qn_calendar')[0].appendChild(div);
                for (var i = 0, len = ma.length; i < len; i++) {
                    delete ma[i];
                }
            },
            bindInEvent: function () {

            },
            bindOutEvent: function () {

            }
        }
        return Calendar;
    }())

    function displayStyle(style) {
        return {
            sc: {//简体中文
                weekMap: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"], year: '年', month: '月', day: '日'
            },
            sc2: {
                weekMap: ["日", "一", "二", "三", "四", "五", "六"], year: '年', month: '月', day: '日'
            },
            en: {//English
                weekMap: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], year: ' ', month: ' ', day: ' '
            },
            en2: {
                weekMap: ["S", "M", "T", "W", "T", "F", "S"], year: ' ', month: ' ', day: ' '
            }
        }[style];
    }
    function daterHead(data) {
        var html = '<div class="calendar-head" style="position: relative; margin-left: 0;"><div class="checkInDate calendar-tab active" style="opacity: 1;"><p class="qn_blue">选择入住日期</p><p class="qn_font12 qn_grey"><span class="data-left">' +
                data[0][0] + '</span>&nbsp;<span class="data-right">' + data[0][1] + '</span></p></div><div class="calendar-vbar"></div><div class="checkOutDate calendar-tab"><p class="qn_blue">选择离店日期</p><p class="qn_font12 qn_grey"><span class="data-left">' +
                data[1][0] + '</span>&nbsp;<span class="data-right">' + data[1][1] + '</span></p></div></div>';
        return html;
    }
    //状态 null(非本月) checkIn(入住) checkOut(离开)  weekend(周末) (workday)本月工作日 disable(不可选) hsaChecked(方框选中)
    function daterBody(data) {
        var html = '<div class="calendar-body"><table><thead><tr><th colspan="7"><h5>' + data.year +
                   '<span class="qn_blue">' + data.month + '</span></h5></th></tr></thead><tbody>' +
                   '<tr class="weeks">';
        for (var i = data.weekStart, len = i + 7; i < len; i++) {
            var j = i % 7;
            if (0 == j || 6 == j) {
                html += '<th class="weekend">' + data.weekStyle[i % 7] + '</th>';
            } else {
                html += '<th>' + data.weekStyle[i % 7] + '</th>';
            }
        }
        html += "</tr>";
        var classes = ['weekend', 'workday', 'workday', 'workday', 'workday', 'workday', 'weekend', 'null', 'disable', 'hasChecked'];
        for (var i = 0, len = data.weeks.length; i < len; i++) {
            html += '<tr class="days">';
            for (var j = 0; j < 7; j++) {
                html += '<td class="' + classes[data.weeks[i][j][0]] + '" data-week="' + data.weeks[i][j][0] + '" data-day="' + data.weeks[i][j][1] + '">';

                html += '<p class=qn_font12 qn_lh>' + data.weeks[i][j][2] + '</p>';

                for (var k = 3, len2 = data.weeks[i][j].length; k < len2; k++) {
                    html += '<p class=' + data.weeks[i][j][k]["class"] + '>' + data.weeks[i][j][k].data + '</p>';
                }
                html += '</td>';
            }
            html += '</tr>';
        }

        html += "</tbody></table></div>";
        return html;
    }
    //测试
    var date = new Date(),
        disStyle = displayStyle('sc');
    var c = new xls.Calendar(1, disStyle, date, 8, [6, "2014-8-9", 9], [0, "2014-8-10", 10]);
    c.display(daterHead, daterBody);
    //console.log(c.monthArray);

    //这里没有将事件添加到Calendar类中，暂时使用jQuery粗糙处理
    var $days = $(".days").find("td.weekend, td.workday"),
        curCheckInDay = null,
        inIndex = -1,
        $checkIn = $(".checkInDate"),
        curCheckOutDay = null,
        outIndex = -1,
        $checkOut = $(".checkOutDate"),
        $checked = $($days[0]);
    $checked.addClass('hasChecked');
    function dayClickHandler() {
        var $self = $(this);
        if (!curCheckInDay) {
            inIndex = $days.index($self);
            for (var i = 0, len = inIndex; i < len; i++) {
                $($days[i]).removeClass("checkIn active").addClass("disable").off();
            }
            
            $self.addClass("checkIn active").append('<p class="qn_font12">入住</p>');
            $checked && $checked.removeClass('hasChecked');
            
            curCheckOutDay || ($checked = $($days[i + 1])) && $checked.addClass("hasChecked").append('<p class="qn_font12">离开</p>');
            curCheckInDay = [$self.attr("data-week"), $self.attr("data-day"), $self.children(".qn_lh").text()];
            
            $checkIn.html('<p class="qn_blue">选择入住日期</p><p class="qn_font12 qn_grey"><span class="data-left">' +
            curCheckInDay[1] + '</span>&nbsp;<span class="data-right">' + disStyle['weekMap'][curCheckInDay[0]] + '</span></p>');
        } 
        else if (!curCheckOutDay) {
            outIndex = $days.index($self);
            for (var i = outIndex + 1, len = $days.length; i < len; i++) {
                $($days[i]).removeClass("checkIn active").addClass("disable").off();
            }
            $self.addClass("checkOut active").append('<p class="qn_font12">离开</p>');
            $checked && $checked.removeClass('hasChecked').children().last().remove();
            curCheckOutDay = [$self.attr("data-week"), $self.attr("data-day"), $self.children(".qn_lh").text()];
                
        }
        if (curCheckInDay && curCheckOutDay) {
            $checkOut.html('<p class="qn_blue">选择离店日期</p><p class="qn_font12 qn_grey"><span class="data-left">' +
            curCheckOutDay[1] + '</span>&nbsp;<span class="data-right">' + disStyle['weekMap'][curCheckOutDay[0]] + '</span></p>');
            alert("跳转~~~~~~~~~~\ncheckIn: " + curCheckInDay + "\ncheckOut: " + curCheckOutDay);
        }
        
        
        //$days.removeClass("weekend workday").addClass("disable");
        //self.prevAll().removeClass("weekend workday").addClass("disable");
        //$self.removeClass("weekend workday").addClass("checkIn active");
        //$self.append('<p class="qn_font12">入住</p>');
        //curCheckInDay = [$self.attr()]
    }
    $days.on("click", dayClickHandler)
    $checkIn.on("click", function () {
        $checkIn.addClass("active");
        $checkOut.removeClass("active");
        if (curCheckInDay) {
            curCheckInDay = null;
            $($days[inIndex]).removeClass('checkIn active').children('p').last().remove();
            curCheckOutDay || $checked && $checked.removeClass('hasChecked').children('p').last().remove() && ($checked = null);
            for (var i = 0, len = inIndex; i < len; i++) {
                $($days[i]).removeClass("disable").on('click', dayClickHandler);
            }
        }
    })
    //重新选择点击
    $checkOut.on("click", function () {
        $checkIn.removeClass("active");
        $checkOut.addClass("active");

        if(curCheckOutDay){
            curCheckOutDay = null;
            $($days[outIndex]).removeClass('checkIn active').children('p').last().remove();
            curCheckInDay && ($checked = $($days[inIndex + 1])) && $checked.addClass("hasChecked").append('<p class="qn_font12">离开</p>');
            for (var i = outIndex+1, len = $days.length; i < len; i++) {
                $($days[i]).removeClass("disable").on('click', dayClickHandler);
            }
        }
    })

}(jQuery))

//自定义事件
var EventCenter = {
    on: function (type,handler) {
        $(document).on(type,handler)
    },
    fire: function (type,data) {
        $(document).trigger(type,data)
    }
}
// EventCenter.on('hello', function(e, data){
//     console.log(data)
// })
// EventCenter.fire('hello', '你好')
var Footer = {
    init: function () {
        this.$footer = $('footer'),
        this.$footer = $('footer')
        this.$ul = this.$footer.find('ul')
        this.$box = this.$footer.find('.box')
        this.$leftBtn = this.$footer.find('.icon-left')
        this.$rightBtn = this.$footer.find('.icon-right')
        this.bind()
        this.render()
        this.isAnimate = false
        this.isToEnd = false
        this.isToStart = true
    },
    bind: function () {
        $(window).resize(() => {
            this.setStyle()
        })
        this.$rightBtn.on('click',() => {
            if(this.isAnimate) return
            var itemWidth = this.$box.find('li').outerWidth(true)
            var rowCount = Math.floor(this.$box.width()/itemWidth)
            console.log(itemWidth,rowCount) 
            if(!this.isToEnd) {
                this.isAnimate = true
                this.$ul.animate({
                    left: '-=' + rowCount * itemWidth
                },400,() => {
                    this.isAnimate = false
                    this.isToStart = false
                    if(parseFloat(this.$box.width()) - parseFloat(this.$ul.css('left')) >= parseFloat(this.$ul.css('width'))) {
                        this.isToEnd = true
                        console.log('end')
                    }
                })
            }
        })
        this.$leftBtn.on('click',() => {
            if(this.isAnimate) return
            var itemWidth = this.$box.find('li').outerWidth(true)
            var rowCount = Math.floor(this.$box.width()/itemWidth)
            if(!this.isToStart) {
                this.isAnimate = true
                this.$ul.animate({
                    left:'+=' + rowCount * itemWidth
                },400,() => {
                    this.isAnimate = false
                    this.isToEnd = false
                    if(parseFloat(this.$ul.css('left')) >= 0){
                        this.isToStart = true
                        console.log('start') 
                    }
                })
            }
        })
        //事件代理
        this.$footer.on('click','li',() => {
            $(this).addClass('active').siblings()
            .removeClass('active')
            EventCenter.fire('select-albumn',{
                channelId: $(this).attr('data-channel-id'),
                channelName: $(this).attr('data-channel-name') 
            })
        })
    },
    render:function () {
        $.getJSON('//jirenguapi.applinzi.com/fm/getChannels.php')
        .done(ret => {
            console.log(ret)
            this.renderFooter(ret.channels)
        }).fail(() => {
            console.log('failed get data')
        })
    },
    renderFooter: function (channels) {
        console.log(channels)
        var html = ''
        channels.unshift({
            channel_id:0,
            name:'我的最爱',
            cover_small: 'http://cloud.hunger-valley.com/17-10-24/1906806.jpg-small',
            cover_middle: 'http://cloud.hunger-valley.com/17-10-24/1906806.jpg-middle',
            cover_big: 'http://cloud.hunger-valley.com/17-10-24/1906806.jpg-big'
        })
        channels.forEach(function (channel) {
            html += '<li data-channel-id='+channel.channel_id+' data-channel-name='+channel.name+'>'
                        + '  <div class="cover" style="background-image:url('+channel.cover_small+')"></div>'
                        + '  <h3>'+channel.name+'</h3>'
                        +'</li>'
        });
        this.$ul.html(html)
        this.setStyle()
    },
    setStyle: function () {
        //这里的li是通过Ajax获取的，所以一开始不能直接在上面写，否则得到的li是空的
        var count = this.$footer.find('li').length
        var width = this.$footer.find('li').outerWidth(true)
        console.log(count,width);
        this.$ul.css({
            width: count * width + 'px' 
        })
    } 
}
var Fm = {
    init:function () {
        this.$container = $('#page-music')
        this.audio = new Audio()
        this.audio.autoplay = true
        this.percent = 0
        this.currentSong = null
        this.collections = this.loadFromLocal()
        this.bind()

        EventCenter.fire('select-albumn', {
            channelId: 'public_tuijian_suibiantingting',
            channelName: '随便听听'
        })
    },
    bind:function () {
        var _this = this
        EventCenter.on('select-albumn',(e,channelObj) => {
            //console.log(e.target)
            //console.log(channelObj)
            this.channelId = channelObj.channelId
            this.channelName = channelObj.channelName
            //console.log(this.channelName)
            //console.log(this,channelId)
            this.loadMusic(() => {
                this.setMusic()
            })
            //console.log('select',channelId)
        })
        
        this.$container.find('.btn-play').on('click',function () {
            var $btn = $(this)
            if($btn.hasClass('icon-play')) {
                $btn.removeClass('icon-play').addClass('icon-pause')
                _this.audio.play()
            }else {
                $btn.removeClass('icon-pause').addClass('icon-play')
                _this.audio.pause()
            }
        })
        this.$container.find('.btn-next').on('click',() => {
            this.loadMusic(() => {
                this.setMusic()
            })
        })
        //对播放中的歌曲进行监听
        this.audio.addEventListener('play',() => {
            console.log('play')
            clearInterval(this.statusClock)
            this.statusClock = setInterval(() => {
                this.updateStatus()
            },1000)
        })
        this.audio.addEventListener('pause',() => {
            console.log('pause')
            clearInterval(this.statusClock)
        })
        this.audio.addEventListener('ended', () => {
            console.log('ended')
            clearInterval(_this.statusClock)
            this.loadMusic()
        })
        //鼠标滑动
        this.$container.find('.bar').on('click',(params)=>{
            this.percent = params.offsetX/this.$container.find('.bar').width()
              this.audio.currentTime = this.percent*this.audio.duration
              //progressNowNode.style.width = percent*100 + '%'
              this.updateStatus()
        })
        //收藏功能
        this.$container.find('.actions .btn-collect').on('click',(e)=>{
            var $btncollect = $(e.target)
            if($btncollect.hasClass('active')){
                $btncollect.removeClass('active')
                delete this.collections[this.currentSong.sid]
            }else{
                $btncollect.addClass('active')
                this.collections[this.currentSong.sid] = this.currentSong
            }
            this.saveToLocal()
        })
    },
    loadMusic () {
        console.log('loading music')
        if(this.channelId === '0'){
            this.loadCollection()
        }else{ 
            $.getJSON('//jirenguapi.applinzi.com/fm/getSong.php',{channel:this.channelId})
            .done((ret) => {
                console.log(ret)
                this.song = ret['song'][0]
                this.setMusic(this.song)
                this.loadLyric()
            })
        }
    },
    setMusic (song) {
        console.log('setMusic...')
        this.currentSong = song 
        this.audio.src = song.url
        $('.bg').css('background-image','url('+song.picture+')')
        this.$container.find('.aside figure').css('background-image','url('+song.picture+')')
        this.$container.find('.detail h1').text(song.title)
        this.$container.find('.detail .author').text(song.artist)
        this.$container.find('.tag').text(this.channelName)
        this.$container.find('.btn-play').removeClass('icon-play').addClass('icon-pause')
        this.$container.find('.icon-earphone').text(this.getRandomInt(100,8000))
        this.$container.find('.icons .icon-heart').text(this.getRandomInt(100,5000))
        this.$container.find('.icon-like').text(this.getRandomInt(100,5000))

        if(this.collections[song.sid]){
            this.$container.find('.btn-collect').addClass('active')
        }else{
            this.$container.find('.btn-collect').removeClass('active')
        }

    },
    loadLyric () {
        $.getJSON('//jirenguapi.applinzi.com/fm/getLyric.php',{sid: this.song.sid})
        .done(ret => {
            var lyric = ret.lyric
            var lyricObj = {}
            lyric.split('\n').forEach(line => {
                var times = line.match(/\d{2}:\d{2}/g)
                var str = line.replace(/\[.+?\]/g,'')
                if(Array.isArray(times)){
                    times.forEach(time => {
                        lyricObj[time] = str
                    })
                } 
            })
            this.lyricObj = lyricObj
            console.log(this.lyricObj)  
        })
    },
    getRandomInt(min,max){
        return Math.floor(Math.random()*(max-min+1)) + min
    },
    updateStatus() {
        //console.log('updating...')
        var min = Math.floor(this.audio.currentTime/60)
        var second = Math.floor(Fm.audio.currentTime%60)+''
        //加空格就是变成字符串,注意位置
        this.$container.find('.current-time').text(min+ ':' +second)
        this.$container.find('.bar-progress').css('width',this.audio.currentTime/this.audio.duration*100 + '%')
        var line = this.lyricObj['0'+min+':'+second]
        console.log(line)
        if(line) {
            this.$container.find('.lyric p').text(line)
            .boomText('zoomIn') 
        }
    },
    loadCollection(){
        let keyArray = Object.keys(this.collections)
        if(keyArray.length === 0) return 
        let randomIndex = Math.floor(Math.random()*keyArray.length)
        let randomSid = keyArray[randomIndex]
        this.setMusic(this.collections[randomSid])
    },
    saveToLocal(){
        localStorage['collections'] = JSON.stringify(this.collections)
    },
    loadFromLocal(){
        return JSON.parse(localStorage['collections']||'{}')
    }
    
}
$.fn.boomText = function(type){
    type = type || 'rollIn'
    console.log(type)
    this.html(function(){
        var arr = $(this).text()
        .split('').map(function(word){
            return '<span class="boomText">'+ word + '</span>'
        })
        return arr.join('')
    })
    
    var index = 0
    var $boomTexts = $(this).find('span')
    var clock = setInterval(function(){
        $boomTexts.eq(index).addClass('animated ' + type)
        index++
        if(index >= $boomTexts.length){
        clearInterval(clock)
        }
    }, 300)
    }
    //$('p').boomText('rollIn') //  https://github.com/daneden/animate.css
Footer.init()
Fm.init()



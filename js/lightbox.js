;(function($){

	var Lightbox = function(){
		var self = this;

		//创建遮罩
		this.popupMask = $('<div id="G-lightbox-mask">');
		//创建弹出框
		this.popupWin  = $('<div id="G-lightbox-popup">');
		//保存 body
		this.bodyNode = $(document.body);

		//渲染 dom
		this.renderDOM();

		//保存元素各部分
		this.picViewArea = this.popupWin.find('div.lightbox-pic-view');	//图片预览区域
		this.popupPic    = this.popupWin.find('img.lightbox-image'); 		//图片
		this.picCaptionArea = this.popupWin.find('div.lightbox-pic-caption'); //图片描述区域
		this.nextBtn 	 = this.popupWin.find('span.lightbox-next-btn');	//下一张
		this.prevBtn 	 = this.popupWin.find('span.lightbox-prev-btn');	//上一张	
		this.captionText = this.popupWin.find('.lightbox-pic-desc');		//图片描述
		this.currentIndex = this.popupWin.find('span.lightbox-of-index');	//当前索引
		this.closeBtn 	 = this.popupWin.find('span.lightbox-close-btn');	//关闭按钮

		this.groupName = null,	//组名
		this.groupDatas = [];	//对象数组

		this.isAnimate = true;	//判断是否在切换过程中

		//使用委托事件机制，确保懒加载的元素也会绑定事件
		this.bodyNode.on('click', '.js-lightbox, *[data-role-lightbox]', function(e){
			//阻止冒泡，防止触发上层元素点击事件
			e.stopPropagation();

			var currentGroupName = $(this).attr('data-group');
			if(currentGroupName != self.groupName){
				self.groupName = currentGroupName;
				//根据当前组名获取当前组的所有数据
				self.getGroup();
			}

			//初始化弹出
			self.initPopup($(this));
		});

		//绑定隐藏事件
		this.popupMask.on('click', function(){
			self.popupMask.fadeOut();
			self.popupWin.fadeOut();
		});
		this.closeBtn.on('click', function(){
			self.popupMask.fadeOut();
			self.popupWin.fadeOut();
		});


		//绑定向上切换按钮事件
		this.prevBtn.hover(function(){
			if(!$(this).hasClass('disabled') && self.groupDatas.length > 1){
				$(this).children('img').stop().fadeIn(200);
			}
		}, function(){
			if(!$(this).hasClass('disabled') && self.groupDatas.length > 1){
				$(this).children('img').stop().fadeOut(200);
			}
		}).click(function(e){
			if(!$(this).hasClass('disabled') && self.isAnimate){
				e.stopPropagation();
				self.goto('prev');	 
			}
		});

		//绑定向下切换按钮事件
		this.nextBtn.hover(function(){
			if(!$(this).hasClass('disabled') && self.groupDatas.length > 1){
				$(this).children('img').stop().fadeIn(200);
			}
		}, function(){
			if(!$(this).hasClass('disabled') && self.groupDatas.length > 1){
				$(this).children('img').stop().fadeOut(200);
			}
		}).click(function(e){
			if(!$(this).hasClass('disabled') && self.isAnimate){
				e.stopPropagation();
				self.goto('next');	
			}
		});
	};

	Lightbox.prototype = {
		//弹出遮罩和弹出框
		showMaskAndPopup: function(sourceSrc, currentId){
			var self = this,
				winWidth  = $(window).width(),
				winHeight = $(window).height(),
				viewHeight = winHeight / 2 + 10,
				groupDatasLength = this.groupDatas.length;

			//先隐藏图片和描述区域
			this.popupPic.hide();
			this.picCaptionArea.hide();

			//显示遮罩
			this.popupMask.fadeIn();

			//设置弹出框的整个图片区域样式
			this.picViewArea.css({
				width: winWidth / 2,
				height: winHeight / 2
			});
			
			//显示弹出框: 此时弹出框在看不到的位置
			this.popupWin.show();

			//设置弹出框的样式
			this.popupWin
				.css({
					width: winWidth / 2 + 10,
					height: winHeight / 2 + 10,
					marginLeft: -(winWidth / 2 + 10) / 2,
					top: -viewHeight,
				}).animate({
					top: (winHeight - viewHeight) / 2
				}, function(){
					//加载图片
					self.loadPic(sourceSrc);
				});

			/**控制切换按钮样式**/
			//获取下标
			this.index = this.getIndexOfId(currentId);

			if(groupDatasLength > 1){
				if( this.index === 0){
					this.prevBtn.addClass('disabled');
					this.nextBtn.removeClass('disabled');
				} else if( this.index === groupDatasLength - 1){
					this.prevBtn.removeClass('disabled');
					this.nextBtn.addClass('disabled');
				} else {
					this.prevBtn.removeClass('disabled');
					this.nextBtn.removeClass('disabled');
				}
			} else {
				this.prevBtn.addClass('disabled');
				this.nextBtn.addClass('disabled');
			}
		},
		goto: function(dir){

			//将要进行动画
			this.isAnimate = false;

			if(dir === 'next'){
				this.index ++;

				if(this.index >= this.groupDatas.length - 1){
					this.nextBtn.addClass('disabled');
					this.nextBtn.children('img').hide();
				} 
				if(this.index != 0){
					this.prevBtn.removeClass('disabled');
				}
			} else {
				this.index --;

				if(this.index <= 0){
					this.prevBtn.addClass('disabled');
					this.prevBtn.children('img').hide();
				} 
				if(this.index != this.groupDatas.length - 1){
					this.nextBtn.removeClass('disabled');
				}
			}

			var src = this.groupDatas[this.index].src;

			this.loadPic(src);
		},
		//加载图片
		loadPic: function(sourceSrc){
			var self = this;

			this.popupPic.css({
				width: 'auto',
				height: 'auto'
			}).hide();

			this.preLoadImg(sourceSrc, function(){
				self.popupPic.attr('src', sourceSrc);

				var picWidth = self.popupPic.width(),
					picHeight = self.popupPic.height();

				//设置宽度和高度
				self.changePic(picWidth, picHeight);
			});
		},
		//设置图片预览区大小和图片大小
		changePic: function(width, height){
			var self = this,
				winWidth = $(window).width(),
				winHeight = $(window).height(),
				scale = Math.min(winWidth / (width + 10), winHeight / (height + 10), 10);

			//按照比例修改图片大小
			width = width * scale;
			height = height * scale;

			//设置图片区域大小
			this.picViewArea.animate({
				width: width - 10,
				height: height - 10
			});
			//设置弹出框大小
			this.popupWin.animate({
				width: width,
				height: height,
				marginLeft: -(width / 2),
				top: (winHeight - height) / 2
			}, function(){
				self.popupPic.css({
					width: width - 10,
					height: height - 10
				}).fadeIn();

				self.isAnimate = true;
				self.picCaptionArea.fadeIn();
			});

			this.captionText.text(this.groupDatas[this.index].caption);
			this.currentIndex.text('当前索引:' + (this.index + 1) + ' of ' + this.groupDatas.length);
		},
		preLoadImg: function(sourceSrc, callback){
			var image = new Image();

			if(!!window.ActiveXObject){
				image.onreadystatechange = function(){
					if(this.ready == 'complete'){
						callback();
					}
				}
			} else {
				image.onload = function(){
					callback();
				}
			}

			image.src = sourceSrc;
		},
		//根据id获取所在组的下标
		getIndexOfId: function(currentId){
			var index = 0;

			$(this.groupDatas).each(function(i){
				index = i;
				if(this.id === currentId){
					return false;
				}
			});

			return index;
		},
		//初始化弹出数据
		//参数为当前的图片信息对象
		initPopup: function($currentObj){
			var self = this,
				sourceSrc = $currentObj.attr('data-source'),
				currentId = $currentObj.attr('data-id');

			this.showMaskAndPopup(sourceSrc, currentId);
		},
		getGroup: function(){
			var self = this,
				itemList = self.bodyNode.find('*[data-group=' + self.groupName + ']');

			//首先清空数组中的数据
			self.groupDatas.length = 0;
			//循环根据条件获取到的所有元素
			itemList.each(function(){
				self.groupDatas.push({
					src: 	 $(this).attr('data-source'),
					id:  	 $(this).attr('data-id'),
					caption: $(this).attr('data-caption')
				});
			});
		},

		renderDOM: function(){
			var strDom = '<div class="lightbox-pic-view">' +
						'	<span class="lightbox-btn lightbox-prev-btn">' +
						'		<img src="img/arrow_left.png" alt="">' +
						'	</span>' +
						'	<img class="lightbox-image" src="">' +
						'	<span class="lightbox-btn lightbox-next-btn">' +
						'		<img src="img/arrow_right.png" alt="">' +
						'	</span>' +
						'</div>' +
						'<div class="lightbox-pic-caption">' +
						'	<div class="lightbox-caption-area">' +
						'		<div class="lightbox-pic-desc">图片标题</div>' +
						'		<span class="lightbox-of-index">当前索引：</span>' +
						'	</div>' +
						'	<span class="lightbox-close-btn">' +
						'		<img src="img/btn_close.jpg" alt="">' +
						'	</span>' +
						'</div>';

			this.popupWin.html(strDom);

			this.bodyNode.append(this.popupMask, this.popupWin);
		}
	};

	window.Lightbox = Lightbox;

})(jQuery);

const loc = window.location.href,
    index = loc.indexOf('#');

if (index > 0) {
  // Remove the initial hash from the visible URL without adding a new history entry.
  history.replaceState(null, document.title, loc.substring(0, index));
}

$.fn.exists = function () {
    return this.length > 0 ? this : false;
}

$(document).ready(function(){

	/*++++++++++++++++++++++++++++++++++++
		tooltips
	++++++++++++++++++++++++++++++++++++++*/
	$(".tooltips").tooltip();


	/*++++++++++++++++++++++++++++++++++++
		slidepage
	++++++++++++++++++++++++++++++++++++++*/
	var SidebarAnim = new TimelineLite({paused:true});
	SidebarAnim
		.to($(".social-icons, #main-nav"),0.2,{left:0})
		.to($("#main"),0.2,{left:250,right:"-=250"},"-=0.2");
	

	$("a.mobilemenu").on("click",function(){
		SidebarAnim.play();
	});
	$(".social-icons, #main-nav, #main").on("click",function(){
		SidebarAnim.reverse();		
	});

	/*++++++++++++++++++++++++++++++++++++
		pages 
	++++++++++++++++++++++++++++++++++++++*/
	var pager = {
		pageContainer : $("div#main"),
		pages : $(".page"),
		menuItems: $("ul#navigation"),
		overlay : $("div#overlay"),
		topz : "500",
		init: function(){

			const self = this;
			self.menuItems.on('click','li:not(.external)', function(e){
				
				e.preventDefault();
				var $li = $(this),
					$target = $($li.children('a').attr('href')),
					currentPosition = $target.attr('data-pos'),
					$secondary = self.pageContainer.children(".currentpage");
				switch (currentPosition){
					case "home" :
						self.reset();
						break;
					case "p1" :
						self.forward($target,$secondary);
						break;
					case "p3" :
						if ( parseInt($target.attr('data-order')) === self.maxz() )
						{	
							// var $gotop2 = $target,
							// 	$gotop1 = $secondary;
							self.backward($target,$secondary);
						} else {
							self.forward($target,$secondary);
						}
					break;
					default:
						return false;
				}
			});

			self.overlay.on('click',function(){
				var $secondary = self.pageContainer.children(".currentpage");
				var $target = self.pageContainer.children("[data-order="+self.maxz()+"]");
				self.backward($target,$secondary);
			});

		},

		reset : function (){

			this.overlay.hide();
			
			var $gotop1 = this.pages.not(".home");
			$gotop1.attr('data-pos','p1').removeAttr('data-order');
			TweenLite.to($gotop1,0.4,{left:"100%",zIndex:0, onComplete:function(){
				$gotop1.removeClass('currentpage');	
			}});

			this.handleMenu();
		},

		forward : function(gotop2 , /* optional */ gotop3){
			
			

			this.handleMenu(gotop2);
			this.overlay.show();
			const maxz = this.maxz();
			gotop2.addClass('currentpage');
			gotop2.attr('data-pos','p2').removeAttr('data-order');
			gotop3.attr('data-pos','p3').attr('data-order',maxz+1);
			

			( new TimelineLite() )
				.set(gotop2,{ left:"100%",zIndex:this.topz})
				.set(gotop3,{zIndex:maxz+1})
				.to(gotop2,0.4,{left:"15%"})
				.to(gotop3,0.3,{ left:0 , onComplete:function(){gotop3.removeClass('currentpage');} },"-=0.2");
		},

		backward : function (gotop2,gotop1){
			

			this.handleMenu(gotop2);
			gotop2.exists() || this.overlay.hide();
			gotop2.addClass('currentpage').removeAttr('data-order').attr('data-pos',"p2");
			gotop1.attr('data-pos','p1');

			(new TimelineLite())
				.set(gotop2,{zIndex:this.topz-1})
				.to(gotop2,0.4,{left:"15%"})
				.to(gotop1,0.5,
					{
						left:"100%",
						onComplete : function(){
							gotop1.removeClass('currentpage');
						}
					},"-=0.3")
				.set(gotop1,{zIndex:0});

		},

		maxz : function(){
			
			var levelArray = this.pages.map( function() {
			    return $(this).attr('data-order');
			}).get();
			const maxz = levelArray.length && Math.max.apply( Math, levelArray );
			return maxz;
		},

		handleMenu : function(){
			

			var menuIndex = ( arguments.length ) ? ( (arguments[0].length) ? arguments[0].index() : 0 ):0;

			this.menuItems.children().eq(menuIndex)
				.addClass('currentmenu')
				.siblings().removeClass('currentmenu');
			

		}
	}



	pager.reset();
	pager.init();


	/*++++++++++++++++++++++++++++++++++++
		click event on ul.timeline titles
	++++++++++++++++++++++++++++++++++++++*/
	$("ul.timeline").children().eq(0)
		.find(".text").slideDown()
		.addClass("open");

	$("ul.timeline").on("click","li", function(){
		const $this = $(this);
		$this.find(".text").slideDown();
		$this.addClass("open");
		$this.siblings('li.open').find(".text").slideUp();
		$this.siblings('li').removeClass("open");
	}).on('mouseenter','li',function(){
		const $this = $(this);
		var anim = new TweenLite($this.find(".subject"),0.4,{'padding-left':20, paused:true});
		($this.hasClass('open')) || anim.play();
	}).on('mouseleave','li',function(){
		var anim = new TweenLite($(this).find(".subject"),0.2,{'padding-left':0});
	});

	/*++++++++++++++++++++++++++++++++++++
		ul-withdetails details show/hide
	++++++++++++++++++++++++++++++++++++++*/
	$("ul.ul-withdetails li").find(".row").on('click',function(){
		// $this = $(this);
		$(this).closest("li").find(".details")
	        .stop(true, true)
	        .animate({
	            height:"toggle",
	            opacity:"toggle"
	        },300);
	}).on('mouseenter',function(){
		const $this = $(this);
		var anim = new TweenLite($this.closest("li").find(".imageoverlay"),0.4,{left:0});
	}).on('mouseleave', function(){
		var anim = new TweenLite($(this).closest("li").find(".imageoverlay"),0.2,{left:"-102%"});
	});



	/*++++++++++++++++++++++++++++++++++++
		Publications page categorization
	++++++++++++++++++++++++++++++++++++++*/
	
	
	$('div#pub-grid').mixitup({
		layoutMode: 'list',
		easing : 'snap',
		transitionSpeed :600,
		onMixEnd: function(){
			$(".tooltips").tooltip();
		}
	}).on('click','div.pubmain a[href="#"]',function(event){
		// Placeholder action links should toggle the publication details, not navigate.
		event.preventDefault();
	}).on('click','div.pubmain a[href]:not([href="#"])',function(event){
		// Real publication links open normally without bubbling into the expand/collapse handler.
		event.stopPropagation();
	}).on('click','div.pubmain',function(){
		// Clicking the publication row expands or collapses its paired details panel.
		var $this = $(this), 
			$item = $this.closest(".item");
		
		$item.find('div.pubdetails').slideToggle(function(){
			$this.find(".pubcollapse i").toggleClass('fa-square-minus fa-square-plus');
		});
	});

	$( '#cd-dropdown' ).dropdownit( {
		gutter : 0
	} );

	$("[name=cd-dropdown]").on("change",function(){
		var item = this.value;		
		$('div#pub-grid').mixitup('filter',item);
	});

	

	/*++++++++++++++++++++++++++++++++++++
		gallery overlays and popups
	++++++++++++++++++++++++++++++++++++++*/ 

	$(".grid").on("mouseenter","li",function(){
		new TweenLite($(this).find(".over"),0.4,{bottom:0,top:0});
	}).on("mouseleave","li",function(){
		new TweenLite($(this).find(".over"),0.4,{bottom:"-100%", top:"100%"});
	});

	if ($.fn.magnificPopup) {
		$('.popup-with-move-anim').magnificPopup({
			type: 'image',

			fixedContentPos: false,
			fixedBgPos: true,

			overflowY: 'auto',

			closeBtnInside: true,
			preloader: false,

			midClick: true,
			removalDelay: 400,
			mainClass: 'my-mfp-slide-bottom'
		});
	}

	/*++++++++++++++++++++++++++++++++++++
		stellar for contact page backgrounds
	++++++++++++++++++++++++++++++++++++++*/
	$(".stellar").stellar({
  		verticalOffset: -100,
  		horizontalScrolling: false,
	});


});


$(window).on('load', function () {

	/*++++++++++++++++++++++++++++++++++++
		gallery masonry layout
	++++++++++++++++++++++++++++++++++++++*/
	var $container = $('#grid');
	// initialize
	if ($.fn.masonry) {
		$container.masonry({
		  itemSelector: 'li'
		});
	}
	
});

var express=require("express");
var mongoose=require("mongoose");
var bodyparser=require("body-parser");
var expressSanitizer=require("express-sanitizer");
var methodOverride=require("method-override");
var User=require("./models/user");
var Comment=require("./models/comments")
var passport=require("passport");
var LocalStrategy=require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");
var app=express();

app.use(require("express-session")({
		secret:"Heyyyy",
	    resave:false,
	    saveUninitialized:false
		}));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new LocalStrategy(User.authenticate()));



app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended:true}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));
mongoose.connect("mongodb://localhost/blogapp");
app.use(function(req,res,next){
	res.locals.currentUser=req.User;
	next();
})




var blogappSchema=new mongoose.Schema({
	title:String,
	image:String,
	body:String,
	created:{type:Date,default:Date.now},
	author:{
		id:{type:mongoose.Schema.Types.ObjectId,
			ref:"User"},
		username:String
		
	
	},
	comments:[
	{type:mongoose.Schema.Types.ObjectId,
     ref:"Comment"
     }
	]
});
var Blogapp=mongoose.model("Blogapp",blogappSchema);



//Blogapp.create({title:"Puppies",image:"https://cdn1-www.dogtime.com/assets/uploads/2011/03/puppy-development.jpg",body:"She is such an adorable puppy"});
app.get("/",function(req,res){
	res.render('splash.ejs');
});
app.get("/register",function(req,res){
	res.render("register.ejs");
});
app.post("/register",function(req,res){
	req.body.username
	req.body.password
	User.register(new User({username:req.body.username}),req.body.password,function(err,user){
		if(err){
			console.log(err);
			return res.render("/register");
		}
		passport.authenticate("local")(req,res,function(){
			res.redirect("/blogs");
			
		});
	});
});
app.get("/login",function(req,res){
	res.render("login.ejs");
});
app.post("/login",passport.authenticate("local",{
	successRedirect :"/blogs",
	failureRedirect:"/login"
	
}),function(req,res){
	
});


app.get("/logout",function(req,res){
	req.logout();
	res.redirect("/");
})




app.get("/blogs",isLogged,function(req,res){
	console.log(req.user);
	Blogapp.find({},function(err,blogs){
		if(err){
			console.log("error has taken pace");
		}
		else{
			res.render("index.ejs",{blogs:blogs,currentUser:req.user});
		}
	});
	
	
});
app.get("/blogs/new",isLogged,function(req,res){
	res.render("new.ejs");
});
app.get("/blogs/:id",isLogged,function(req,res){
	
	Blogapp.findById(req.params.id).populate("comments").exec(function(err,found){
		if(err){
			res.render("/blogs");
		}else{
			
			res.render("show.ejs",{blog:found});
			
		}
	});
});

app.post("/blogs",isLogged,function(req,res){
	req.body.blog.body=req.sanitize(req.body.blog.body)
	Blogapp.create(req.body.blog,function(err,blogs){
		
		if(err){
			res.render("new.ejs");
		}
		else{
			
			res.redirect("/blogs");
		}
	});
});
app.get("/blogs/:id/edit",isLogged,function(req,res){
	Blogapp.findById(req.params.id,function(err,found){
		if(err){
			res.redirect("/blogs");}
		
			res.render("edit.ejs",{blog:found});
		
	});
	
	
	
});

app.put("/blogs/:id",isLogged,function(req,res){
	Blogapp.findByIdAndUpdate(req.params.id,req.body.blog,function(err,updated){
		if(err){
			res.redirect("/blogs");
		}
		else{
			res.render("/blogs"+req.params.id);
		}
	});

	
});
app.delete("/blogs/:id",isLogged,function(req,res){
	Blogapp.findByIdAndDelete(req.params.id,function(err,found){
		if(err){
			res.redirect("/blogs");
		}
		else{
			res.redirect("/blogs");
		}
	});
});

app.get("/blogs/:id/comments/new",isLogged,function(req,res){
	Blogapp.findById(req.params.id,function(err,blog){
		if(err){
			console.log(err);
		}
		else{
			res.render("comments.ejs",{blog:blog});
		}
		
	});
	
});
app.post("/blogs/:id/comments",function(req,res){
		Blogapp.findById(req.params.id,function(err,blog){
			if(err){
				console.log(err);
				res.redirect("/blogs");
			}
			else{
				Comment.create(req.body.comment,function(err,comment){
					
					blog.comments.push(comment);
					blog.save();
					res.redirect("/blogs/"+ blog._id);
					
				});
			
			
		}
  });
});





function isLogged(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
	
};





app.listen(100,process.env.IP,function(){
	console.log("The server has started");
});
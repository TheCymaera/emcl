<?php
$url = strtok("$_SERVER[REQUEST_SCHEME]://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]", "\?|#");

// page basic settings
$page_title 		= "EMCL Compiler";
$page_description 	= "A compiler for minecraft function files.";
$page_author		= "Morgan";
$page_keywords		= "Heledron, Hadron, Cymaera, Minecraft";

// page open graph settings
$page_og_title 			= $page_title;
$page_og_description 	= $page_description;
$page_og_url 			= $url;
$page_og_image 			= $page_og_url . "thumbnail.png";
$page_og_type 			= "website";
?>
<!DOCTYPE html>
<html class="full-window-document" data-theme="dark">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

	<!-- pwa -->
	<link rel="manifest" href="./manifest.json">
	<meta name="theme-color" content="#333">
	<link rel="apple-touch-icon" href="./assets/images/icon-512.png">
	<meta name="apple-mobile-web-app-status-bar-style" content="default">
	<meta name="apple-mobile-web-app-capable" content="yes" />

	<!-- title & favicon -->
	<title><?php echo $page_title;?></title>
    <link rel="icon" href="./assets/images/icon-512.png" type="image/png"/>
	
	<!-- info -->
    <meta name="author" content="<?php echo $page_author;?>"/>
    <meta name="description" content="<?php echo $page_description;?>"/>
    <meta name="keywords" content="<?php echo $page_keywords;?>"/>
	
	<!-- sharing -->
    <meta property="og:title" content="<?php echo $page_og_title;?>"/>
    <meta property="og:description" content="<?php echo $page_og_description;?>"/>
    <meta property="og:url"   content="<?php echo $page_og_url;?>"/>
    <meta property="og:image" content="<?php echo $page_og_image;?>"/>
    <meta property="og:type"  content="<?php echo $page_og_type;?>"/>

	<!-- styles -->
	<link rel="stylesheet" type="text/css" href="./assets/fontawesome-free-5.13.1-web/css/all.min.css"/>
	<link rel="stylesheet" type="text/css" href="./dst/main.css"/>

	<!-- scripts -->
	<script type="module" src="./dst/main.js"></script>
</head>
<body>
	<tabs->
		<div class="center-content square"><i class="fa fa-info"></i></div>
		<div class="center-content"><b>Console</b></div>
		<div class="center-content"><b>Sources</b></div>
		<div class="center-content"><b>Output</b></div>
	</tabs->
	<backdrop- id="panelContainer" class="expand-children"></backdrop->
	<bottom-navigation-bar>
		<div 
			id="install" 
			class="center-content square" 
			title="Install" 
			style="display: none"
		><i class="fa fa-download"></i></div>
		<bottom-navigation-bar-buffer></bottom-navigation-bar-buffer>
		<div 
			id="loadProject" 
			class="center-content square" 
			title="Load Project"
		><i class="fa fa-folder"></i></div>
		<div 
			id="compile" 
			class="center-content square"  
			title="Compile"
		><i class="fa fa-play"></i></div>
	</bottom-navigation-bar>
</body>
</html>
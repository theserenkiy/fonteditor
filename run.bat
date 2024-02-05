@echo off
node -v >NUL 2>&1
IF %ERRORLEVEL% NEQ 0 ( 
   	echo *****************************************************************************
	echo.
   	echo ERROR^!^!^! Nodejs is not installed^!
	echo Please visit https://nodejs.org/ to install latest LTS version of NodeJS
	echo.
   	echo *****************************************************************************
) else (
	if exist node_modules\ (
		@echo on
		node server.js
	) else (
		npm install --cache /tmp/empty-cache
		if %ERRORLEVEL% NEQ 0 (
			echo *****************************************************************************
			echo.
			echo ERROR^!^!^! Cannot install required Node modules^!
			echo Probably you have troubles with your network connection
			echo You can try install modules manually by running "npm i" command from this folder
			echo.
			echo *****************************************************************************
		) else (
			@echo on
			node server.js
		)
	)
)
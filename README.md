# Home Assistant Display App for Raspberry Pi

A web application designed to display Home Assistant data on a 720x720px round display. The app features radial temperature gauges and background charts for visualizing your smart home data.

## Features

- Real-time connection to Home Assistant using WebSocket API
- Radial temperature and humidity gauges
- Background charts showing historical data
- Responsive design optimized for a 720x720px round display
- Easy setup page for configuration

## Installation

1. Clone this repository to your Raspberry Pi:

```bash
git clone https://github.com/yourusername/ha-display-app.git
cd ha-display-app
```

2. Install dependencies:

```bash
npm install
```

3. Start the application:

```bash
npm start
```

4. Open your browser and navigate to:

```
http://localhost:3000
```

## Configuration

On first run, you'll be redirected to the setup page where you can configure:

1. Your Home Assistant URL (e.g., https://10.0.0.128)
2. Your Long-Lived Access Token (generated in Home Assistant)
3. Entity IDs for temperature and humidity sensors

## Creating a Long-Lived Access Token

1. Log in to your Home Assistant instance
2. Click on your profile (bottom left corner)
3. Scroll down to "Long-Lived Access Tokens"
4. Create a new token with a name like "Display App"
5. Copy the token and paste it in the setup page

## Running on Boot

To make the app start automatically when your Raspberry Pi boots:

1. Install PM2:

```bash
npm install -g pm2
```

2. Start the app with PM2:

```bash
pm2 start server.js --name "ha-display"
```

3. Save the PM2 configuration:

```bash
pm2 save
```

4. Set up PM2 to start on boot:

```bash
pm2 startup
```

Follow the instructions provided by the command to complete the setup.

## Customization

You can customize the app by modifying the following files:

- `public/js/config.js`: Change gauge ranges, colors, and other settings
- `public/css/style.css`: Modify the appearance of the app
- `public/js/gauges.js`: Customize gauge behavior
- `public/js/charts.js`: Customize chart behavior

## License

MIT

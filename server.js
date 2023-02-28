const restify = require('restify')
const errors = require('restify-errors')
const axios = require('axios')
const moment = require('moment')
const _ = require('lodash')

const PEGELONLINE_ENDPOINT = 'https://pegelonline.wsv.de/webservices/rest-api/v2'

const server = restify.createServer({
  name: 'lametric-pegelonline-wrapper',
  version: '1.0.0'
})

server.use(restify.plugins.acceptParser(server.acceptable))
server.use(restify.plugins.queryParser())
server.use(restify.plugins.bodyParser())

function fetchMeasurements (station) {
  return axios.get(`${PEGELONLINE_ENDPOINT}/stations/${station}/W/measurements.json?start=PT24H`)
}

function fetchStation (station) {
  return axios.get(`${PEGELONLINE_ENDPOINT}/stations/${station}/W.json?includeCurrentMeasurement=true`)
}

function getIconByTrend (trend) {
  switch (trend) {
    case 1:
      return 'i120' // UP
    case -1:
      return 'i124' // DOWN
    case 0:
      return 'i401' // EQUAL
    default:
      return null
  }
}

function fetchStationsAndMeasurements (req, res, next) {
  req.station = req.params.station || req.query.station
  axios.all([fetchStation(req.station), fetchMeasurements(req.station)])
  .then(axios.spread((station, measurements) => {
    req.station = station.data
    req.measurements = measurements.data
    return next()
  }))
  .catch(err => {
    return next(errors.makeErrFromCode(err.response.data.status, err.response.data.message))
  })
}

function groupMeasurementsByDayAndHour (req, res, next) {
  req.measurements = _.groupBy(req.measurements, p => {
    return moment(p.timestamp).format('DDDHH')
  })
  return next()
}

function getMeanValueForMeasurements (req, res, next) {
  req.measurements = _.map(req.measurements, p => {
    return _.meanBy(p, 'value')
  })
  return next()
}

function getMaxGaugeLevel (req, res, next) {
  req.maxGaugeLevel = req.params.maxGaugeLevel || req.query.maxGaugeLevel
  req.maxGaugeLevel = parseInt(req.maxGaugeLevel)
  req.maxGaugeLevel = req.maxGaugeLevel ? req.maxGaugeLevel : _.max(req.measurements)
  return next()
}

function createLaMetricOutput (req, res, next) {
  req.lametric = {
    frames: [
      {
        icon: (req.station.currentMeasurement.value >= 640) ? 'i17894' : 'i17893',
        goalData: {
          start: 0,
          current: req.station.currentMeasurement.value,
          end: req.maxGaugeLevel,
          unit: 'cm'
        }
      },
      {
        text: req.station.currentMeasurement.stateMnwMhw,
        icon: getIconByTrend(req.station.currentMeasurement.trend)
      },
      {
        index: 1,
        chartData: req.measurements
      }
    ]
  }
  return next()
}

server.get('/favicon.ico', (req, res, next) => {
  res.send(404)
  return next()
})

server.get('/sitemap.xml', (req, res, next) => {
  res.send(404)
  return next()
})

server.get('/robots.txt', (req, res, next) => {
  res.send(404)
  return next()
})

server.get('/',
  (req, res, next) => {
    if (!req.query.station) {
      res.send(errors.makeErrFromCode(400, 'Usage: /:station/:maxGaugeLevel or ?station=NAME&maxGaugeLevel=VALUE (See: https://pegelonline.wsv.de/gast/pegeltabelle)'))
    }
    return next()
  },
  fetchStationsAndMeasurements,
  groupMeasurementsByDayAndHour,
  getMeanValueForMeasurements,
  getMaxGaugeLevel,
  createLaMetricOutput,
  (req, res, next) => {
    res.send(req.lametric)
    return next()
  }
)

server.get('/:station',
  fetchStationsAndMeasurements,
  groupMeasurementsByDayAndHour,
  getMeanValueForMeasurements,
  getMaxGaugeLevel,
  createLaMetricOutput,
  (req, res, next) => {
    res.send(req.lametric)
    return next()
  }
)

server.get('/:station/:maxGaugeLevel',
  fetchStationsAndMeasurements,
  groupMeasurementsByDayAndHour,
  getMeanValueForMeasurements,
  getMaxGaugeLevel,
  createLaMetricOutput,
  (req, res, next) => {
    res.send(req.lametric)
    return next()
  }
)

server.listen(8080, () => {
  console.log('%s listening at %s', server.name, server.url)
})

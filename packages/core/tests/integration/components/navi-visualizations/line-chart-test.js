import Ember from 'ember';
import moment from 'moment';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { initialize as injectC3Enhancements } from 'navi-core/initializers/inject-c3-enhancements';
import DateUtils from 'navi-core/utils/date';
import { setupMock, teardownMock } from '../../../helpers/mirage-helper';
import { getOwner } from '@ember/application';

let MetadataService;

const TEMPLATE = hbs`
  {{navi-visualizations/line-chart
    model=model
    options=options
  }}`;

const Model = Ember.A([
  {
    request: {
      metrics: ['uniqueIdentifier', 'totalPageViews', 'revenue(currency=USD)'],
      intervals: [
        {
          start: '2016-05-30 00:00:00.000',
          end: '2016-06-04 00:00:00.000'
        }
      ],
      logicalTable: {
        timeGrain: 'day'
      }
    },
    response: {
      rows: [
        {
          dateTime: '2016-05-30 00:00:00.000',
          uniqueIdentifier: 172933788,
          totalPageViews: 3669828357,
          'revenue(currency=USD)': 2000323439.23
        },
        {
          dateTime: '2016-05-31 00:00:00.000',
          uniqueIdentifier: 183206656,
          totalPageViews: 4088487125,
          'revenue(currency=USD)': 1999243823.74
        },
        {
          dateTime: '2016-06-01 00:00:00.000',
          uniqueIdentifier: 183380921,
          totalPageViews: 4024700302,
          'revenue(currency=USD)': 1400324934.92
        },
        {
          dateTime: '2016-06-02 00:00:00.000',
          uniqueIdentifier: 180559793,
          totalPageViews: 3950276031,
          'revenue(currency=USD)': 923843934.11
        },
        {
          dateTime: '2016-06-03 00:00:00.000',
          uniqueIdentifier: 172724594,
          totalPageViews: 3697156058,
          'revenue(currency=USD)': 1623430236.42
        }
      ]
    }
  }
]);

moduleForComponent('navi-visualizations/line-chart', 'Integration | Component | line chart', {
  integration: true,
  beforeEach() {
    setupMock();
    injectC3Enhancements();
    this.set('model', Model);
    this.set('options', {
      axis: {
        y: {
          series: {
            type: 'metric',
            config: {
              metrics: [
                {
                  metric: 'uniqueIdentifier',
                  canonicalName: 'uniqueIdentifier',
                  toJSON() {
                    return this;
                  }
                }
              ]
            }
          }
        }
      }
    });

    MetadataService = getOwner(this).lookup('service:bard-metadata');
    return MetadataService.loadMetadata();
  },

  afterEach() {
    teardownMock();
  }
});

test('it renders', function(assert) {
  assert.expect(2);

  this.render(TEMPLATE);

  assert.ok(this.$('.navi-vis-c3-chart').is(':visible'), 'The line chart widget component is visible');

  assert.equal(this.$('.c3-chart-line').length, 1, 'One chart line is present on the chart');
});

test('missing data - metrics', function(assert) {
  assert.expect(1);

  this.set(
    'model',
    Ember.A([
      {
        request: {
          metrics: ['uniqueIdentifier'],
          intervals: [
            {
              start: '2016-05-30 00:00:00.000',
              end: '2016-06-02 00:00:00.000'
            }
          ],
          logicalTable: {
            timeGrain: 'day'
          }
        },
        response: {
          rows: [
            {
              dateTime: '2016-05-30 00:00:00.000',
              uniqueIdentifier: 172933788
            },
            {
              dateTime: '2016-06-01 00:00:00.000',
              uniqueIdentifier: 183380921
            }
          ]
        }
      }
    ])
  );

  this.render(TEMPLATE);

  assert.deepEqual(
    this.$('.c3-circle')
      .map(function() {
        return $(this).css('opacity');
      })
      .get(),
    ['1', '0', '1'],
    'Missing data points are hidden by the chart'
  );
});

test('missing data - dimensions', function(assert) {
  assert.expect(1);

  this.set('options', {
    axis: {
      y: {
        series: {
          type: 'dimension',
          config: {
            metric: {
              metric: 'uniqueIdentifier',
              canonicalName: 'uniqueIdentifier',
              toJSON() {
                return this;
              }
            },
            dimensionOrder: ['age'],
            dimensions: [
              {
                name: 'All Other',
                values: { age: '-3' }
              }
            ]
          }
        }
      }
    }
  });

  this.set(
    'model',
    Ember.A([
      {
        request: {
          metrics: ['uniqueIdentifier'],
          intervals: [
            {
              start: '2016-05-30 00:00:00.000',
              end: '2016-06-02 00:00:00.000'
            }
          ],
          logicalTable: {
            timeGrain: 'day'
          }
        },
        response: {
          rows: [
            {
              dateTime: '2016-05-30 00:00:00.000',
              'age|id': '-3',
              'age|desc': 'All Other',
              uniqueIdentifier: 172933788
            },
            {
              dateTime: '2016-06-01 00:00:00.000',
              'age|id': '-3',
              'age|desc': 'All Other',
              uniqueIdentifier: 183380921
            }
          ]
        }
      }
    ])
  );

  this.render(TEMPLATE);

  assert.deepEqual(
    this.$('.c3-circle')
      .map(function() {
        return $(this).css('opacity');
      })
      .get(),
    ['1', '0', '1'],
    'Missing data points are hidden by the chart'
  );
});

test('multiple series', function(assert) {
  assert.expect(1);

  this.set('options', {
    axis: {
      y: {
        series: {
          type: 'metric',
          config: {
            metrics: [
              {
                metric: 'uniqueIdentifier',
                canonicalName: 'uniqueIdentifier',
                toJSON() {
                  return this;
                }
              },
              {
                metric: 'totalPageViews',
                canonicalName: 'totalPageViews',
                toJSON() {
                  return this;
                }
              },
              {
                metric: 'revenue',
                parameters: {
                  currency: 'USD'
                },
                canonicalName: 'revenue(currency=USD)',
                toJSON() {
                  return this;
                }
              }
            ]
          }
        }
      }
    }
  });

  this.set('model', Model);
  this.render(TEMPLATE);

  assert.equal(
    this.$('.c3-chart-line').length,
    3,
    'Three chart lines are present in the chart based on the metrics in the request'
  );
});

test('y axis label', function(assert) {
  assert.expect(3);

  this.set('options', {
    axis: {
      y: {
        series: {
          type: 'dimension',
          config: {
            metric: {
              metric: 'totalPageViews',
              canonicalName: 'totalPageViews',
              toJSON() {
                return this;
              }
            },
            dimensionOrder: ['age'],
            dimensions: [
              {
                name: 'All Other',
                values: { age: '-3' }
              },
              {
                name: 'under 13',
                values: { age: '1' }
              },
              {
                name: '13 - 25',
                values: { age: '2' }
              },
              {
                name: '25 - 35',
                values: { age: '3' }
              },
              {
                name: '35 - 45',
                values: { age: '4' }
              }
            ]
          }
        }
      }
    }
  });

  this.set('model', Model);
  this.render(TEMPLATE);

  assert.equal(
    this.$('.c3-axis-y-label').text(),
    'Total Page Views',
    'The metric name is displayed in the y axis label correctly for a dimension chart'
  );

  this.set('options', {
    axis: {
      y: {
        series: {
          type: 'dimension',
          config: {
            metric: {
              metric: 'revenue',
              parameters: {
                currency: 'USD'
              },
              canonicalName: 'revenue(currency=USD)',
              toJSON() {
                return this;
              }
            },
            dimensionOrder: ['age'],
            dimensions: [
              {
                name: 'All Other',
                values: { age: '-3' }
              },
              {
                name: 'under 13',
                values: { age: '1' }
              },
              {
                name: '13 - 25',
                values: { age: '2' }
              },
              {
                name: '25 - 35',
                values: { age: '3' }
              },
              {
                name: '35 - 45',
                values: { age: '4' }
              }
            ]
          }
        }
      }
    }
  });

  assert.equal(
    this.$('.c3-axis-y-label').text(),
    'Revenue (USD)',
    'Parameterized metrics are displayed correctly in the y axis label'
  );

  //set chart type to metric
  this.set('options', {
    axis: {
      y: {
        series: {
          type: 'metric',
          config: {
            metrics: [
              {
                metric: 'uniqueIdentifier',
                canonicalName: 'uniqueIdentifier',
                toJSON() {
                  return this;
                }
              },
              {
                metric: 'totalPageViews',
                canonicalName: 'totalPageViews',
                toJSON() {
                  return this;
                }
              }
            ]
          }
        }
      }
    }
  });

  assert.equal(this.$('.c3-axis-y-label').text(), '', 'The y axis label is not displayed for a metric chart.');
});

test('Highlight data points', function(assert) {
  // assert.expect(1);

  let anomalousDataModel = Ember.A([
    {
      request: {
        metrics: ['uniqueIdentifier'],
        logicalTable: {
          timeGrain: 'day'
        },
        intervals: [
          {
            start: '2017-09-01 00:00:00.000',
            end: '2017-09-07 00:00:00.000'
          }
        ]
      },
      response: {
        rows: [
          {
            dateTime: '2017-09-01 00:00:00.000',
            uniqueIdentifier: 155191081
          },
          {
            dateTime: '2017-09-02 00:00:00.000',
            uniqueIdentifier: 172724594
          },
          {
            dateTime: '2017-09-03 00:00:00.000',
            uniqueIdentifier: 183380921
          },
          {
            dateTime: '2017-09-04 00:00:00.000',
            uniqueIdentifier: 172933788
          },
          {
            dateTime: '2017-09-05 00:00:00.000',
            uniqueIdentifier: 183206656
          },
          {
            dateTime: '2017-09-06 00:00:00.000',
            uniqueIdentifier: 183380921
          },
          {
            dateTime: '2017-09-07 00:00:00.000',
            uniqueIdentifier: 180559793
          }
        ]
      }
    },
    new Ember.RSVP.Promise(resolve => {
      resolve(
        Ember.A([
          {
            index: 1,
            actual: 12,
            predicted: 172724594.12345,
            standardDeviation: 123.123456
          },
          {
            index: 3,
            actual: 10,
            predicted: 172933788.12345,
            standardDeviation: 123.123456
          },
          {
            index: 5,
            actual: 14,
            predicted: 183380921.12345,
            standardDeviation: 123.123456
          }
        ])
      );
    })
  ]);

  this.set('model', anomalousDataModel);
  this.set('options', {
    axis: {
      y: {
        series: {
          type: 'metric',
          config: {
            metrics: [
              {
                metric: 'uniqueIdentifier',
                canonicalName: 'uniqueIdentifier',
                toJSON() {
                  return this;
                }
              }
            ]
          }
        }
      }
    }
  });
  this.render(TEMPLATE);

  assert.equal(this.$('.c3-selected-circles circle').length, 3, 'Three data points are highlighted in chart');
});

test('dateTime model', function(assert) {
  assert.expect(1);
  let start = moment('2016-05-01 00:00:00.000'),
    end = moment('2018-07-01 00:00:00.000'),
    current = start.clone(),
    rows = [];

  while (current.isBefore(end)) {
    rows.push({
      dateTime: current.format(DateUtils.API_DATE_FORMAT_STRING),
      uniqueIdentifier: Math.random() * 1000
    });

    current.add(1, 'month');
  }

  this.set(
    'model',
    Ember.A([
      {
        request: {
          metrics: ['uniqueIdentifier'],
          intervals: [
            {
              start: start.format(DateUtils.API_DATE_FORMAT_STRING),
              end: end.format(DateUtils.API_DATE_FORMAT_STRING)
            }
          ],
          logicalTable: {
            timeGrain: 'month'
          }
        },
        response: { rows }
      }
    ])
  );
  this.set('options', {
    axis: {
      y: {
        series: {
          type: 'dateTime',
          config: {
            metric: {
              metric: 'uniqueIdentifier',
              canonicalName: 'uniqueIdentifier',
              toJSON() {
                return this;
              }
            },
            timeGrain: 'year'
          }
        }
      }
    }
  });

  this.render(TEMPLATE);

  assert.deepEqual(
    this.$('.c3-legend-item')
      .map(function() {
        return $(this).text();
      })
      .get(),
    ['2016', '2017', '2018'],
    'Three years time series are displayed on y-axis'
  );
});

test('Metric series legend', function(assert) {
  assert.expect(1);

  this.set('options', {
    axis: {
      y: {
        series: {
          type: 'metric',
          config: {
            metrics: [
              {
                metric: 'uniqueIdentifier',
                canonicalName: 'uniqueIdentifier',
                toJSON() {
                  return this;
                }
              },
              {
                metric: 'totalPageViews',
                canonicalName: 'totalPageViews',
                toJSON() {
                  return this;
                }
              },
              {
                metric: 'revenue',
                parameters: {
                  currency: 'USD'
                },
                canonicalName: 'revenue(currency=USD)',
                toJSON() {
                  return this;
                }
              }
            ]
          }
        }
      }
    }
  });

  this.set('model', Model);
  this.render(TEMPLATE);

  assert.deepEqual(
    this.$('.c3-legend-item')
      .map(function() {
        return $(this).text();
      })
      .get(),
    ['Unique Identifiers', 'Total Page Views', 'Revenue (USD)'],
    'Metric display names are used properly for parameterized and non-parameterized metrics in the legend'
  );
});

test('cleanup tooltip', function(assert) {
  assert.expect(2);

  const template = hbs`
  {{#if shouldRender}}
    {{navi-visualizations/line-chart
      model=model
      options=options
    }}
  {{/if}}`;

  this.set('options', {
    axis: {
      y: {
        series: {
          type: 'metric',
          config: {
            metrics: [
              {
                metric: 'uniqueIdentifier',
                canonicalName: 'uniqueIdentifier',
                toJSON() {
                  return this;
                }
              }
            ]
          }
        }
      }
    }
  });

  const findTooltipComponent = () =>
    Object.keys(getOwner(this).__registry__.registrations).find(r =>
      r.startsWith('component:line-chart-metric-tooltip-')
    );

  this.set('model', Model);
  this.set('shouldRender', true);
  this.render(template);

  assert.ok(findTooltipComponent(), 'tooltip component is registered when chart is created');

  this.set('shouldRender', false);

  assert.notOk(findTooltipComponent(), 'tooltip component is unregistered when chart is destroyed');
});

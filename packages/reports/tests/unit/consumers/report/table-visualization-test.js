import { moduleFor, test } from 'ember-qunit';
import { UpdateReportActions } from 'navi-reports/services/update-report-action-dispatcher';
import { get } from '@ember/object';
import { A as arr } from '@ember/array';
import { run } from '@ember/runloop';

moduleFor('consumer:report/table-visualization', 'Unit | Consumer | report table visualization', {
  needs: ['consumer:action-consumer']
});

test('UPDATE_TABLE_COLUMN_ORDER', function(assert) {
  assert.expect(2);

  let currentModel = {
    request: {
      metrics: arr()
    },
    visualization: {
      type: 'table',
      metadata: { columns: 'old' }
    }
  };

  run(() => {
    this.subject().send(UpdateReportActions.UPDATE_TABLE_COLUMN_ORDER, { currentModel }, [{ type: 'test' }]);
  });

  assert.deepEqual(
    get(currentModel, 'visualization.metadata.columns'),
    [{ type: 'test' }],
    'updateColumnOrder updates the columns in the visualization metadata'
  );

  let invalidVisModel = {
    visualization: {
      type: 'line-chart'
    }
  };

  assert.throws(
    () => this.subject().send(UpdateReportActions.UPDATE_TABLE_COLUMN_ORDER, { currentModel: invalidVisModel }, 'new'),
    /Visualization must be a table/,
    'Trying to update column order on a non-table visualization throws an error'
  );
});

test('reorder metrics', function(assert) {
  assert.expect(1);

  let currentModel = {
    request: {
      metrics: arr([
        {
          canonicalName: 'a'
        },
        {
          canonicalName: 'b'
        }
      ])
    },
    visualization: {
      type: 'table',
      metadata: {}
    }
  };

  let newColumns = [
    {
      type: 'metric',
      field: { metric: 'b' }
    },
    {
      type: 'threshold',
      field: { metric: 'a' }
    }
  ];

  run(() => {
    this.subject().send(UpdateReportActions.UPDATE_TABLE_COLUMN_ORDER, { currentModel }, newColumns);
  });

  assert.deepEqual(
    get(currentModel, 'request.metrics').map(metric => get(metric, 'canonicalName')),
    ['b', 'a'],
    'updateColumnOrder updates the order of the metrics in the request metrics'
  );
});

test('UPDATE_TABLE_COLUMN', function(assert) {
  assert.expect(1);

  let currentModel = {
    visualization: {
      type: 'table',
      metadata: {
        columns: [{ field: { metric: 'a' }, value: 1 }, { field: { metric: 'b' }, value: 2 }]
      }
    }
  };

  run(() => {
    this.subject().send(
      UpdateReportActions.UPDATE_TABLE_COLUMN,
      { currentModel },
      { field: { metric: 'b' }, value: 3 }
    );
  });

  assert.deepEqual(
    get(currentModel, 'visualization.metadata.columns'),
    [{ field: { metric: 'a' }, value: 1 }, { field: { metric: 'b' }, value: 3 }],
    'updateColumn updates the column in the visualization metadata'
  );
});

// Reference dwelling: canonical FloorPlanProjectV1 data, not renderer-specific arrays.
(function(root){const project = {
  "schema": "rubik-sota.floorplan-project",
  "schemaVersion": "1.0.0",
  "id": "prj_reference-home",
  "name": "三室两厅两卫",
  "createdAt": "2026-09-30T00:00:00Z",
  "updatedAt": "2026-09-30T00:00:00Z",
  "units": "mm",
  "coordinateSystem": {
    "origin": "plan-top-left",
    "xAxis": "right",
    "yAxis": "down",
    "rotation": "degrees-clockwise"
  },
  "scale": {
    "confidence": "estimated",
    "method": "template",
    "declaredRatio": "1:60"
  },
  "defaults": {
    "wallHeightMm": 2800,
    "wallThicknessMm": 240
  },
  "walls": [
    {
      "id": "wal_ref-w0",
      "start": {
        "x": 1580,
        "y": -120
      },
      "end": {
        "x": 2120,
        "y": -120
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "load-bearing",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w1",
      "start": {
        "x": 1700,
        "y": 0
      },
      "end": {
        "x": 1700,
        "y": 300
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "load-bearing",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w2",
      "start": {
        "x": 2120,
        "y": -120
      },
      "end": {
        "x": 4580,
        "y": -120
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w3",
      "start": {
        "x": 4580,
        "y": -120
      },
      "end": {
        "x": 5140,
        "y": -120
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w4",
      "start": {
        "x": 5760,
        "y": -120
      },
      "end": {
        "x": 6050,
        "y": -120
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w5",
      "start": {
        "x": 6050,
        "y": -120
      },
      "end": {
        "x": 6600,
        "y": -120
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "load-bearing",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w6",
      "start": {
        "x": 6480,
        "y": 0
      },
      "end": {
        "x": 6480,
        "y": 300
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "load-bearing",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w7",
      "start": {
        "x": 6600,
        "y": -120
      },
      "end": {
        "x": 9960,
        "y": -120
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w8",
      "start": {
        "x": 9960,
        "y": -120
      },
      "end": {
        "x": 10510,
        "y": -120
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "load-bearing",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w9",
      "start": {
        "x": 10390,
        "y": 0
      },
      "end": {
        "x": 10390,
        "y": 300
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "load-bearing",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w10",
      "start": {
        "x": 10390,
        "y": 300
      },
      "end": {
        "x": 10390,
        "y": 800
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w11",
      "start": {
        "x": 10390,
        "y": 2600
      },
      "end": {
        "x": 10390,
        "y": 3090
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w12",
      "start": {
        "x": 10390,
        "y": 3090
      },
      "end": {
        "x": 10390,
        "y": 4260
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "load-bearing",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w13",
      "start": {
        "x": 10390,
        "y": 5740
      },
      "end": {
        "x": 10390,
        "y": 6370
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "load-bearing",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w14",
      "start": {
        "x": 9960,
        "y": 6490
      },
      "end": {
        "x": 10510,
        "y": 6490
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "load-bearing",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w15",
      "start": {
        "x": 10390,
        "y": 6610
      },
      "end": {
        "x": 10390,
        "y": 7400
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "load-bearing",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w16",
      "start": {
        "x": 10390,
        "y": 9770
      },
      "end": {
        "x": 10390,
        "y": 10560
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "load-bearing",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w17",
      "start": {
        "x": 9960,
        "y": 10680
      },
      "end": {
        "x": 10510,
        "y": 10680
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "load-bearing",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w18",
      "start": {
        "x": 4580,
        "y": 10680
      },
      "end": {
        "x": 9960,
        "y": 10680
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w19",
      "start": {
        "x": 10510,
        "y": 10680
      },
      "end": {
        "x": 12090,
        "y": 10680
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w20",
      "start": {
        "x": 11970,
        "y": 9960
      },
      "end": {
        "x": 11970,
        "y": 10560
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w21",
      "start": {
        "x": 4700,
        "y": 9200
      },
      "end": {
        "x": 4700,
        "y": 10560
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w22",
      "start": {
        "x": 4700,
        "y": 7960
      },
      "end": {
        "x": 4700,
        "y": 8310
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w23",
      "start": {
        "x": 3620,
        "y": 8080
      },
      "end": {
        "x": 4580,
        "y": 8080
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w24",
      "start": {
        "x": 2180,
        "y": 8080
      },
      "end": {
        "x": 3620,
        "y": 8080
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "load-bearing",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w25",
      "start": {
        "x": 2300,
        "y": 7590
      },
      "end": {
        "x": 2300,
        "y": 7960
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "load-bearing",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w26",
      "start": {
        "x": 2180,
        "y": 7495
      },
      "end": {
        "x": 2420,
        "y": 7495
      },
      "thicknessMm": 190,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w27",
      "start": {
        "x": -240,
        "y": 8080
      },
      "end": {
        "x": 2180,
        "y": 8080
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w28",
      "start": {
        "x": -120,
        "y": 3610
      },
      "end": {
        "x": -120,
        "y": 7960
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w29",
      "start": {
        "x": 100,
        "y": 4950
      },
      "end": {
        "x": 100,
        "y": 5190
      },
      "thicknessMm": 200,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w30",
      "start": {
        "x": 200,
        "y": 5070
      },
      "end": {
        "x": 1275,
        "y": 5070
      },
      "thicknessMm": 240,
      "heightMm": 1000,
      "structure": "low",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w31",
      "start": {
        "x": 1580,
        "y": 3598
      },
      "end": {
        "x": 2420,
        "y": 3598
      },
      "thicknessMm": 455,
      "heightMm": 2800,
      "structure": "load-bearing",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w32",
      "start": {
        "x": 2300,
        "y": 4430
      },
      "end": {
        "x": 2300,
        "y": 5796
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w33",
      "start": {
        "x": 2135,
        "y": 4950
      },
      "end": {
        "x": 2135,
        "y": 5190
      },
      "thicknessMm": 90,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w34",
      "start": {
        "x": 2420,
        "y": 5070
      },
      "end": {
        "x": 4580,
        "y": 5070
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w35",
      "start": {
        "x": 4700,
        "y": 3280
      },
      "end": {
        "x": 4700,
        "y": 4075
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w36",
      "start": {
        "x": 4700,
        "y": 4860
      },
      "end": {
        "x": 4700,
        "y": 5190
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w37",
      "start": {
        "x": 2420,
        "y": 3490
      },
      "end": {
        "x": 4580,
        "y": 3490
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w38",
      "start": {
        "x": 4700,
        "y": 0
      },
      "end": {
        "x": 4700,
        "y": 2400
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w39",
      "start": {
        "x": 4820,
        "y": 2200
      },
      "end": {
        "x": 6360,
        "y": 2200
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w40",
      "start": {
        "x": 6480,
        "y": 300
      },
      "end": {
        "x": 6480,
        "y": 1198
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w41",
      "start": {
        "x": 6480,
        "y": 1983
      },
      "end": {
        "x": 6480,
        "y": 2400
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w42",
      "start": {
        "x": 6083,
        "y": 3538
      },
      "end": {
        "x": 6600,
        "y": 3538
      },
      "thicknessMm": 337,
      "heightMm": 2800,
      "structure": "load-bearing",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w43",
      "start": {
        "x": 6360,
        "y": 3325
      },
      "end": {
        "x": 6600,
        "y": 3325
      },
      "thicknessMm": 90,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w44",
      "start": {
        "x": 6600,
        "y": 3490
      },
      "end": {
        "x": 9960,
        "y": 3490
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w45",
      "start": {
        "x": 9960,
        "y": 3490
      },
      "end": {
        "x": 10270,
        "y": 3490
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "load-bearing",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w46",
      "start": {
        "x": 6203,
        "y": 4600
      },
      "end": {
        "x": 6203,
        "y": 6610
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-w47",
      "start": {
        "x": 6323,
        "y": 6490
      },
      "end": {
        "x": 9960,
        "y": 6490
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-window-0",
      "start": {
        "x": 5140,
        "y": -120
      },
      "end": {
        "x": 5760,
        "y": -120
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-window-1",
      "start": {
        "x": 1700,
        "y": 300
      },
      "end": {
        "x": 1700,
        "y": 3370
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-window-2",
      "start": {
        "x": -240,
        "y": 3490
      },
      "end": {
        "x": 1580,
        "y": 3490
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-window-3",
      "start": {
        "x": 2300,
        "y": 3825
      },
      "end": {
        "x": 2300,
        "y": 4430
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-window-4",
      "start": {
        "x": 10510,
        "y": 6490
      },
      "end": {
        "x": 12090,
        "y": 6490
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-window-5",
      "start": {
        "x": 11970,
        "y": 6610
      },
      "end": {
        "x": 11970,
        "y": 9960
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-window-6",
      "start": {
        "x": 10510,
        "y": 710
      },
      "end": {
        "x": 11130,
        "y": 710
      },
      "thicknessMm": 100,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-window-7",
      "start": {
        "x": 11080,
        "y": 760
      },
      "end": {
        "x": 11080,
        "y": 2650
      },
      "thicknessMm": 100,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-window-8",
      "start": {
        "x": 10510,
        "y": 2700
      },
      "end": {
        "x": 11130,
        "y": 2700
      },
      "thicknessMm": 100,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-window-9",
      "start": {
        "x": 10510,
        "y": 4160
      },
      "end": {
        "x": 11130,
        "y": 4160
      },
      "thicknessMm": 100,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-window-10",
      "start": {
        "x": 11080,
        "y": 4210
      },
      "end": {
        "x": 11080,
        "y": 5785
      },
      "thicknessMm": 100,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-window-11",
      "start": {
        "x": 10510,
        "y": 5835
      },
      "end": {
        "x": 11130,
        "y": 5835
      },
      "thicknessMm": 100,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-door-0",
      "start": {
        "x": 4700,
        "y": 2400
      },
      "end": {
        "x": 4700,
        "y": 3280
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-door-1",
      "start": {
        "x": 6480,
        "y": 2400
      },
      "end": {
        "x": 6480,
        "y": 3280
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-door-2",
      "start": {
        "x": 6480,
        "y": 1198
      },
      "end": {
        "x": 6480,
        "y": 1983
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-door-3",
      "start": {
        "x": 4700,
        "y": 4075
      },
      "end": {
        "x": 4700,
        "y": 4860
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-door-4",
      "start": {
        "x": 6203,
        "y": 3707
      },
      "end": {
        "x": 6203,
        "y": 4600
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-door-5",
      "start": {
        "x": 4700,
        "y": 8310
      },
      "end": {
        "x": 4700,
        "y": 9200
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-slide-0",
      "start": {
        "x": 10390,
        "y": 7400
      },
      "end": {
        "x": 10390,
        "y": 9770
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-slide-1",
      "start": {
        "x": 1275,
        "y": 5070
      },
      "end": {
        "x": 2090,
        "y": 5070
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "partition",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-bay-0",
      "start": {
        "x": 10390,
        "y": 800
      },
      "end": {
        "x": 10390,
        "y": 2600
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "wal_ref-bay-1",
      "start": {
        "x": 10390,
        "y": 4260
      },
      "end": {
        "x": 10390,
        "y": 5740
      },
      "thicknessMm": 240,
      "heightMm": 2800,
      "structure": "exterior",
      "status": "existing",
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    }
  ],
  "openings": [
    {
      "id": "opn_window-0",
      "wallId": "wal_ref-window-0",
      "kind": "window",
      "offsetMm": 0,
      "widthMm": 620,
      "heightMm": 1000,
      "sillHeightMm": 1400,
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "opn_window-1",
      "wallId": "wal_ref-window-1",
      "kind": "window",
      "offsetMm": 0,
      "widthMm": 3070,
      "heightMm": 1500,
      "sillHeightMm": 900,
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "opn_window-2",
      "wallId": "wal_ref-window-2",
      "kind": "window",
      "offsetMm": 0,
      "widthMm": 1820,
      "heightMm": 1500,
      "sillHeightMm": 900,
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "opn_window-3",
      "wallId": "wal_ref-window-3",
      "kind": "window",
      "offsetMm": 0,
      "widthMm": 605,
      "heightMm": 1500,
      "sillHeightMm": 900,
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "opn_window-4",
      "wallId": "wal_ref-window-4",
      "kind": "window",
      "offsetMm": 0,
      "widthMm": 1580,
      "heightMm": 1500,
      "sillHeightMm": 900,
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "opn_window-5",
      "wallId": "wal_ref-window-5",
      "kind": "window",
      "offsetMm": 0,
      "widthMm": 3350,
      "heightMm": 1500,
      "sillHeightMm": 900,
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "opn_window-6",
      "wallId": "wal_ref-window-6",
      "kind": "window",
      "offsetMm": 0,
      "widthMm": 620,
      "heightMm": 1950,
      "sillHeightMm": 450,
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "opn_window-7",
      "wallId": "wal_ref-window-7",
      "kind": "window",
      "offsetMm": 0,
      "widthMm": 1890,
      "heightMm": 1950,
      "sillHeightMm": 450,
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "opn_window-8",
      "wallId": "wal_ref-window-8",
      "kind": "window",
      "offsetMm": 0,
      "widthMm": 620,
      "heightMm": 1950,
      "sillHeightMm": 450,
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "opn_window-9",
      "wallId": "wal_ref-window-9",
      "kind": "window",
      "offsetMm": 0,
      "widthMm": 620,
      "heightMm": 1950,
      "sillHeightMm": 450,
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "opn_window-10",
      "wallId": "wal_ref-window-10",
      "kind": "window",
      "offsetMm": 0,
      "widthMm": 1575,
      "heightMm": 1950,
      "sillHeightMm": 450,
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "opn_window-11",
      "wallId": "wal_ref-window-11",
      "kind": "window",
      "offsetMm": 0,
      "widthMm": 620,
      "heightMm": 1950,
      "sillHeightMm": 450,
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "opn_door-0",
      "wallId": "wal_ref-door-0",
      "kind": "door",
      "offsetMm": 0,
      "widthMm": 880,
      "heightMm": 2100,
      "sillHeightMm": 0,
      "source": {
        "method": "template",
        "review": "unreviewed"
      },
      "swing": {
        "hinge": "end",
        "side": "right"
      },
      "isEntrance": false
    },
    {
      "id": "opn_door-1",
      "wallId": "wal_ref-door-1",
      "kind": "door",
      "offsetMm": 0,
      "widthMm": 880,
      "heightMm": 2100,
      "sillHeightMm": 0,
      "source": {
        "method": "template",
        "review": "unreviewed"
      },
      "swing": {
        "hinge": "end",
        "side": "left"
      },
      "isEntrance": false
    },
    {
      "id": "opn_door-2",
      "wallId": "wal_ref-door-2",
      "kind": "door",
      "offsetMm": 0,
      "widthMm": 785,
      "heightMm": 2100,
      "sillHeightMm": 0,
      "source": {
        "method": "template",
        "review": "unreviewed"
      },
      "swing": {
        "hinge": "start",
        "side": "right"
      },
      "isEntrance": false
    },
    {
      "id": "opn_door-3",
      "wallId": "wal_ref-door-3",
      "kind": "door",
      "offsetMm": 0,
      "widthMm": 785,
      "heightMm": 2100,
      "sillHeightMm": 0,
      "source": {
        "method": "template",
        "review": "unreviewed"
      },
      "swing": {
        "hinge": "end",
        "side": "right"
      },
      "isEntrance": false
    },
    {
      "id": "opn_door-4",
      "wallId": "wal_ref-door-4",
      "kind": "door",
      "offsetMm": 0,
      "widthMm": 893,
      "heightMm": 2100,
      "sillHeightMm": 0,
      "source": {
        "method": "template",
        "review": "unreviewed"
      },
      "swing": {
        "hinge": "end",
        "side": "left"
      },
      "isEntrance": false
    },
    {
      "id": "opn_door-5",
      "wallId": "wal_ref-door-5",
      "kind": "door",
      "offsetMm": 0,
      "widthMm": 890,
      "heightMm": 2100,
      "sillHeightMm": 0,
      "source": {
        "method": "template",
        "review": "unreviewed"
      },
      "swing": {
        "hinge": "end",
        "side": "left"
      },
      "isEntrance": true
    },
    {
      "id": "opn_slide-0",
      "wallId": "wal_ref-slide-0",
      "kind": "sliding-door",
      "offsetMm": 0,
      "widthMm": 2370,
      "heightMm": 2400,
      "sillHeightMm": 0,
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "opn_slide-1",
      "wallId": "wal_ref-slide-1",
      "kind": "sliding-door",
      "offsetMm": 0,
      "widthMm": 815,
      "heightMm": 2100,
      "sillHeightMm": 0,
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "opn_bay-0",
      "wallId": "wal_ref-bay-0",
      "kind": "opening",
      "offsetMm": 0,
      "widthMm": 1800,
      "heightMm": 2400,
      "sillHeightMm": 0,
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "opn_bay-1",
      "wallId": "wal_ref-bay-1",
      "kind": "opening",
      "offsetMm": 0,
      "widthMm": 1480,
      "heightMm": 2400,
      "sillHeightMm": 0,
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    }
  ],
  "rooms": [
    {
      "id": "rom_master",
      "name": "主卧室",
      "polygon": [
        {
          "x": 6600,
          "y": 0
        },
        {
          "x": 10270,
          "y": 0
        },
        {
          "x": 10270,
          "y": 3370
        },
        {
          "x": 6600,
          "y": 3370
        }
      ],
      "floorMaterialId": "mat_wood",
      "countsTowardArea": true,
      "source": {
        "method": "template",
        "review": "unreviewed"
      },
      "labelAt": {
        "x": 8435,
        "y": 2420
      }
    },
    {
      "id": "rom_mbath",
      "name": "主卫浴",
      "polygon": [
        {
          "x": 4820,
          "y": 0
        },
        {
          "x": 6360,
          "y": 0
        },
        {
          "x": 6360,
          "y": 2080
        },
        {
          "x": 4820,
          "y": 2080
        }
      ],
      "floorMaterialId": "mat_antislip",
      "countsTowardArea": true,
      "source": {
        "method": "template",
        "review": "unreviewed"
      },
      "labelAt": {
        "x": 5980,
        "y": 1780
      }
    },
    {
      "id": "rom_kid",
      "name": "小孩房",
      "polygon": [
        {
          "x": 1820,
          "y": 0
        },
        {
          "x": 4580,
          "y": 0
        },
        {
          "x": 4580,
          "y": 3370
        },
        {
          "x": 1820,
          "y": 3370
        }
      ],
      "floorMaterialId": "mat_wood",
      "countsTowardArea": true,
      "source": {
        "method": "template",
        "review": "unreviewed"
      },
      "labelAt": {
        "x": 3380,
        "y": 2330
      }
    },
    {
      "id": "rom_gbath",
      "name": "客卫浴",
      "polygon": [
        {
          "x": 2420,
          "y": 3610
        },
        {
          "x": 4580,
          "y": 3610
        },
        {
          "x": 4580,
          "y": 4950
        },
        {
          "x": 2420,
          "y": 4950
        }
      ],
      "floorMaterialId": "mat_antislip",
      "countsTowardArea": true,
      "source": {
        "method": "template",
        "review": "unreviewed"
      },
      "labelAt": {
        "x": 3760,
        "y": 4620
      }
    },
    {
      "id": "rom_laundry",
      "name": "洗衣阳台",
      "polygon": [
        {
          "x": 0,
          "y": 3610
        },
        {
          "x": 2180,
          "y": 3610
        },
        {
          "x": 2180,
          "y": 4950
        },
        {
          "x": 0,
          "y": 4950
        }
      ],
      "floorMaterialId": "mat_antislip",
      "countsTowardArea": true,
      "source": {
        "method": "template",
        "review": "unreviewed"
      },
      "labelAt": {
        "x": 1250,
        "y": 4330
      }
    },
    {
      "id": "rom_child",
      "name": "子女房",
      "polygon": [
        {
          "x": 6323,
          "y": 3610
        },
        {
          "x": 10270,
          "y": 3610
        },
        {
          "x": 10270,
          "y": 6370
        },
        {
          "x": 6323,
          "y": 6370
        }
      ],
      "floorMaterialId": "mat_wood",
      "countsTowardArea": true,
      "source": {
        "method": "template",
        "review": "unreviewed"
      },
      "labelAt": {
        "x": 8850,
        "y": 4850
      }
    },
    {
      "id": "rom_kitchen",
      "name": "厨房",
      "polygon": [
        {
          "x": 0,
          "y": 5190
        },
        {
          "x": 2180,
          "y": 5190
        },
        {
          "x": 2180,
          "y": 7960
        },
        {
          "x": 0,
          "y": 7960
        }
      ],
      "floorMaterialId": "mat_tile600",
      "countsTowardArea": true,
      "source": {
        "method": "template",
        "review": "unreviewed"
      },
      "labelAt": {
        "x": 1300,
        "y": 6500
      }
    },
    {
      "id": "rom_dining",
      "name": "餐厅",
      "polygon": [
        {
          "x": 2420,
          "y": 5190
        },
        {
          "x": 4820,
          "y": 5190
        },
        {
          "x": 4820,
          "y": 7960
        },
        {
          "x": 2420,
          "y": 7960
        },
        {
          "x": 2420,
          "y": 7400
        },
        {
          "x": 2180,
          "y": 7400
        },
        {
          "x": 2180,
          "y": 5796
        },
        {
          "x": 2420,
          "y": 5796
        }
      ],
      "floorMaterialId": "mat_tile800",
      "countsTowardArea": true,
      "source": {
        "method": "template",
        "review": "unreviewed"
      },
      "labelAt": {
        "x": 3900,
        "y": 5520
      }
    },
    {
      "id": "rom_hall",
      "name": "过道",
      "polygon": [
        {
          "x": 4820,
          "y": 2320
        },
        {
          "x": 6360,
          "y": 2320
        },
        {
          "x": 6360,
          "y": 3370
        },
        {
          "x": 6083,
          "y": 3370
        },
        {
          "x": 6083,
          "y": 6610
        },
        {
          "x": 4820,
          "y": 6610
        }
      ],
      "floorMaterialId": "mat_tile800",
      "countsTowardArea": true,
      "source": {
        "method": "template",
        "review": "unreviewed"
      },
      "labelAt": {
        "x": 5450,
        "y": 4450
      }
    },
    {
      "id": "rom_living",
      "name": "客厅",
      "polygon": [
        {
          "x": 4820,
          "y": 6610
        },
        {
          "x": 10270,
          "y": 6610
        },
        {
          "x": 10270,
          "y": 10560
        },
        {
          "x": 4820,
          "y": 10560
        }
      ],
      "floorMaterialId": "mat_tile800",
      "countsTowardArea": true,
      "source": {
        "method": "template",
        "review": "unreviewed"
      },
      "labelAt": {
        "x": 7600,
        "y": 7560
      }
    },
    {
      "id": "rom_balcony",
      "name": "休闲阳台",
      "polygon": [
        {
          "x": 10510,
          "y": 6610
        },
        {
          "x": 11850,
          "y": 6610
        },
        {
          "x": 11850,
          "y": 10560
        },
        {
          "x": 10510,
          "y": 10560
        }
      ],
      "floorMaterialId": "mat_walnut",
      "countsTowardArea": true,
      "source": {
        "method": "template",
        "review": "unreviewed"
      },
      "labelAt": {
        "x": 11180,
        "y": 9450
      }
    },
    {
      "id": "rom_bay1",
      "name": "主卧飘窗",
      "polygon": [
        {
          "x": 10270,
          "y": 800
        },
        {
          "x": 10510,
          "y": 800
        },
        {
          "x": 10510,
          "y": 760
        },
        {
          "x": 11030,
          "y": 760
        },
        {
          "x": 11030,
          "y": 2650
        },
        {
          "x": 10510,
          "y": 2650
        },
        {
          "x": 10510,
          "y": 2600
        },
        {
          "x": 10270,
          "y": 2600
        }
      ],
      "floorMaterialId": "mat_marble",
      "countsTowardArea": false,
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    },
    {
      "id": "rom_bay2",
      "name": "子女房飘窗",
      "polygon": [
        {
          "x": 10270,
          "y": 4260
        },
        {
          "x": 10510,
          "y": 4260
        },
        {
          "x": 10510,
          "y": 4210
        },
        {
          "x": 11030,
          "y": 4210
        },
        {
          "x": 11030,
          "y": 5785
        },
        {
          "x": 10510,
          "y": 5785
        },
        {
          "x": 10510,
          "y": 5740
        },
        {
          "x": 10270,
          "y": 5740
        }
      ],
      "floorMaterialId": "mat_marble",
      "countsTowardArea": false,
      "source": {
        "method": "template",
        "review": "unreviewed"
      }
    }
  ],
  "materials": [
    {
      "id": "mat_wood",
      "name": "橡木地板",
      "category": "floor",
      "appearance": {
        "color": "#d8b88a",
        "preset": "wood"
      }
    },
    {
      "id": "mat_walnut",
      "name": "胡桃木地板",
      "category": "floor",
      "appearance": {
        "color": "#9b7250",
        "preset": "walnut"
      }
    },
    {
      "id": "mat_tile800",
      "name": "800 地砖",
      "category": "floor",
      "appearance": {
        "color": "#ebe6dc",
        "preset": "tile-800"
      }
    },
    {
      "id": "mat_tile600",
      "name": "600 地砖",
      "category": "floor",
      "appearance": {
        "color": "#dfe3e1",
        "preset": "tile-600"
      }
    },
    {
      "id": "mat_marble",
      "name": "大理石",
      "category": "floor",
      "appearance": {
        "color": "#f1eee8",
        "preset": "marble"
      }
    },
    {
      "id": "mat_antislip",
      "name": "300 防滑砖",
      "category": "floor",
      "appearance": {
        "color": "#d3d8d4",
        "preset": "tile-300"
      }
    },
    {
      "id": "mat_terrazzo",
      "name": "水磨石",
      "category": "floor",
      "appearance": {
        "color": "#e6dfd3",
        "preset": "terrazzo"
      }
    },
    {
      "id": "mat_carpet",
      "name": "满铺地毯",
      "category": "floor",
      "appearance": {
        "color": "#c9c3d3",
        "preset": "carpet"
      }
    }
  ],
  "objects": [
    {
      "id": "obj_template-001",
      "type": "bed",
      "name": "双人床",
      "position": {
        "x": 8300,
        "y": 1000
      },
      "size": {
        "widthMm": 1800,
        "depthMm": 2000
      },
      "rotationDeg": 0,
      "color": "#c9d6df"
    },
    {
      "id": "obj_template-002",
      "type": "nightstand",
      "name": "床头柜",
      "position": {
        "x": 7150,
        "y": 220
      },
      "size": {
        "widthMm": 450,
        "depthMm": 400
      },
      "rotationDeg": 0,
      "color": "#e8dccb"
    },
    {
      "id": "obj_template-003",
      "type": "nightstand",
      "name": "床头柜",
      "position": {
        "x": 9450,
        "y": 220
      },
      "size": {
        "widthMm": 450,
        "depthMm": 400
      },
      "rotationDeg": 0,
      "color": "#e8dccb"
    },
    {
      "id": "obj_template-004",
      "type": "wardrobe",
      "name": "衣柜",
      "position": {
        "x": 8800,
        "y": 3070
      },
      "size": {
        "widthMm": 2400,
        "depthMm": 600
      },
      "rotationDeg": 180,
      "color": "#efe6d8"
    },
    {
      "id": "obj_template-005",
      "type": "baycushion",
      "name": "飘窗垫",
      "position": {
        "x": 10770,
        "y": 1705
      },
      "size": {
        "widthMm": 520,
        "depthMm": 1800
      },
      "rotationDeg": 0,
      "color": "#e7dccd"
    },
    {
      "id": "obj_template-006",
      "type": "shower",
      "name": "淋浴房",
      "position": {
        "x": 5270,
        "y": 450
      },
      "size": {
        "widthMm": 900,
        "depthMm": 900
      },
      "rotationDeg": 0,
      "color": "#e4edf2"
    },
    {
      "id": "obj_template-007",
      "type": "toilet",
      "name": "马桶",
      "position": {
        "x": 5170,
        "y": 1500
      },
      "size": {
        "widthMm": 400,
        "depthMm": 700
      },
      "rotationDeg": 270,
      "color": "#ffffff"
    },
    {
      "id": "obj_template-008",
      "type": "vanity",
      "name": "浴室柜",
      "position": {
        "x": 6110,
        "y": 700
      },
      "size": {
        "widthMm": 800,
        "depthMm": 500
      },
      "rotationDeg": 90,
      "color": "#eef1f3"
    },
    {
      "id": "obj_template-009",
      "type": "bed",
      "name": "单人床",
      "position": {
        "x": 2420,
        "y": 1000
      },
      "size": {
        "widthMm": 1200,
        "depthMm": 2000
      },
      "rotationDeg": 0,
      "color": "#e8d5b5"
    },
    {
      "id": "obj_template-010",
      "type": "desk",
      "name": "书桌",
      "position": {
        "x": 2120,
        "y": 2700
      },
      "size": {
        "widthMm": 1200,
        "depthMm": 600
      },
      "rotationDeg": 270,
      "color": "#e2cfb4"
    },
    {
      "id": "obj_template-011",
      "type": "chair",
      "name": "椅子",
      "position": {
        "x": 2700,
        "y": 2700
      },
      "size": {
        "widthMm": 450,
        "depthMm": 480
      },
      "rotationDeg": 90,
      "color": "#cfc6b8"
    },
    {
      "id": "obj_template-012",
      "type": "wardrobe",
      "name": "衣柜",
      "position": {
        "x": 4280,
        "y": 1000
      },
      "size": {
        "widthMm": 1600,
        "depthMm": 600
      },
      "rotationDeg": 90,
      "color": "#efe6d8"
    },
    {
      "id": "obj_template-013",
      "type": "bookshelf",
      "name": "书架",
      "position": {
        "x": 3500,
        "y": 150
      },
      "size": {
        "widthMm": 800,
        "depthMm": 300
      },
      "rotationDeg": 0,
      "color": "#e2cfb4"
    },
    {
      "id": "obj_template-014",
      "type": "shower",
      "name": "淋浴区",
      "position": {
        "x": 2870,
        "y": 4280
      },
      "size": {
        "widthMm": 900,
        "depthMm": 1340
      },
      "rotationDeg": 0,
      "color": "#e4edf2"
    },
    {
      "id": "obj_template-015",
      "type": "toilet",
      "name": "马桶",
      "position": {
        "x": 3560,
        "y": 3960
      },
      "size": {
        "widthMm": 400,
        "depthMm": 700
      },
      "rotationDeg": 0,
      "color": "#ffffff"
    },
    {
      "id": "obj_template-016",
      "type": "vanity",
      "name": "浴室柜",
      "position": {
        "x": 4150,
        "y": 3850
      },
      "size": {
        "widthMm": 700,
        "depthMm": 480
      },
      "rotationDeg": 0,
      "color": "#eef1f3"
    },
    {
      "id": "obj_template-017",
      "type": "washer",
      "name": "洗衣机",
      "position": {
        "x": 300,
        "y": 3960
      },
      "size": {
        "widthMm": 600,
        "depthMm": 600
      },
      "rotationDeg": 270,
      "color": "#e6ebee"
    },
    {
      "id": "obj_template-018",
      "type": "vanity",
      "name": "洗衣池",
      "position": {
        "x": 250,
        "y": 4600
      },
      "size": {
        "widthMm": 600,
        "depthMm": 500
      },
      "rotationDeg": 270,
      "color": "#eef1f3"
    },
    {
      "id": "obj_template-019",
      "type": "counter",
      "name": "橱柜台面",
      "position": {
        "x": 300,
        "y": 6575
      },
      "size": {
        "widthMm": 2770,
        "depthMm": 600
      },
      "rotationDeg": 270,
      "color": "#e9e5de"
    },
    {
      "id": "obj_template-020",
      "type": "counter",
      "name": "橱柜台面",
      "position": {
        "x": 1390,
        "y": 7660
      },
      "size": {
        "widthMm": 1580,
        "depthMm": 600
      },
      "rotationDeg": 180,
      "color": "#e9e5de"
    },
    {
      "id": "obj_template-021",
      "type": "stove",
      "name": "燃气灶",
      "position": {
        "x": 300,
        "y": 6200
      },
      "size": {
        "widthMm": 750,
        "depthMm": 450
      },
      "rotationDeg": 270,
      "color": "#dcdcdc"
    },
    {
      "id": "obj_template-022",
      "type": "ksink",
      "name": "水槽",
      "position": {
        "x": 1400,
        "y": 7680
      },
      "size": {
        "widthMm": 800,
        "depthMm": 450
      },
      "rotationDeg": 180,
      "color": "#e1e6ea"
    },
    {
      "id": "obj_template-023",
      "type": "fridge",
      "name": "冰箱",
      "position": {
        "x": 2770,
        "y": 5540
      },
      "size": {
        "widthMm": 700,
        "depthMm": 700
      },
      "rotationDeg": 0,
      "color": "#dfe4e8"
    },
    {
      "id": "obj_template-024",
      "type": "table",
      "name": "餐桌",
      "position": {
        "x": 3600,
        "y": 6650
      },
      "size": {
        "widthMm": 1400,
        "depthMm": 800
      },
      "rotationDeg": 90,
      "color": "#e2cfb4"
    },
    {
      "id": "obj_template-025",
      "type": "chair",
      "name": "餐椅",
      "position": {
        "x": 2940,
        "y": 6320
      },
      "size": {
        "widthMm": 450,
        "depthMm": 480
      },
      "rotationDeg": 270,
      "color": "#cfc6b8"
    },
    {
      "id": "obj_template-026",
      "type": "chair",
      "name": "餐椅",
      "position": {
        "x": 2940,
        "y": 6980
      },
      "size": {
        "widthMm": 450,
        "depthMm": 480
      },
      "rotationDeg": 270,
      "color": "#cfc6b8"
    },
    {
      "id": "obj_template-027",
      "type": "chair",
      "name": "餐椅",
      "position": {
        "x": 4260,
        "y": 6320
      },
      "size": {
        "widthMm": 450,
        "depthMm": 480
      },
      "rotationDeg": 90,
      "color": "#cfc6b8"
    },
    {
      "id": "obj_template-028",
      "type": "chair",
      "name": "餐椅",
      "position": {
        "x": 4260,
        "y": 6980
      },
      "size": {
        "widthMm": 450,
        "depthMm": 480
      },
      "rotationDeg": 90,
      "color": "#cfc6b8"
    },
    {
      "id": "obj_template-029",
      "type": "cabinet",
      "name": "餐边柜",
      "position": {
        "x": 3500,
        "y": 7785
      },
      "size": {
        "widthMm": 1600,
        "depthMm": 350
      },
      "rotationDeg": 180,
      "color": "#efe6d8"
    },
    {
      "id": "obj_template-030",
      "type": "rug",
      "name": "地毯",
      "position": {
        "x": 7600,
        "y": 8950
      },
      "size": {
        "widthMm": 2600,
        "depthMm": 1800
      },
      "rotationDeg": 0,
      "color": "#d9cbb8"
    },
    {
      "id": "obj_template-031",
      "type": "tvstand",
      "name": "电视柜",
      "position": {
        "x": 7600,
        "y": 6810
      },
      "size": {
        "widthMm": 2400,
        "depthMm": 400
      },
      "rotationDeg": 0,
      "color": "#e2cfb4"
    },
    {
      "id": "obj_template-032",
      "type": "sofa",
      "name": "三人沙发",
      "position": {
        "x": 7600,
        "y": 10110
      },
      "size": {
        "widthMm": 3000,
        "depthMm": 900
      },
      "rotationDeg": 180,
      "color": "#b7c4b0"
    },
    {
      "id": "obj_template-033",
      "type": "coffeetable",
      "name": "茶几",
      "position": {
        "x": 7600,
        "y": 8900
      },
      "size": {
        "widthMm": 1300,
        "depthMm": 650
      },
      "rotationDeg": 0,
      "color": "#e8dccb"
    },
    {
      "id": "obj_template-034",
      "type": "armchair",
      "name": "单人沙发",
      "position": {
        "x": 9500,
        "y": 8900
      },
      "size": {
        "widthMm": 850,
        "depthMm": 850
      },
      "rotationDeg": 90,
      "color": "#d6b99a"
    },
    {
      "id": "obj_template-035",
      "type": "shoecab",
      "name": "鞋柜",
      "position": {
        "x": 4995,
        "y": 9900
      },
      "size": {
        "widthMm": 1000,
        "depthMm": 350
      },
      "rotationDeg": 270,
      "color": "#efe6d8"
    },
    {
      "id": "obj_template-036",
      "type": "plant",
      "name": "绿植",
      "position": {
        "x": 9950,
        "y": 10250
      },
      "size": {
        "widthMm": 500,
        "depthMm": 500
      },
      "rotationDeg": 0,
      "color": "#a9c39b"
    },
    {
      "id": "obj_template-037",
      "type": "plant",
      "name": "绿植",
      "position": {
        "x": 5250,
        "y": 7050
      },
      "size": {
        "widthMm": 500,
        "depthMm": 500
      },
      "rotationDeg": 0,
      "color": "#a9c39b"
    },
    {
      "id": "obj_template-038",
      "type": "bed",
      "name": "双人床",
      "position": {
        "x": 7323,
        "y": 5500
      },
      "size": {
        "widthMm": 1500,
        "depthMm": 2000
      },
      "rotationDeg": 270,
      "color": "#d8c7dc"
    },
    {
      "id": "obj_template-039",
      "type": "wardrobe",
      "name": "衣柜",
      "position": {
        "x": 8500,
        "y": 3910
      },
      "size": {
        "widthMm": 2000,
        "depthMm": 600
      },
      "rotationDeg": 0,
      "color": "#efe6d8"
    },
    {
      "id": "obj_template-040",
      "type": "desk",
      "name": "书桌",
      "position": {
        "x": 9500,
        "y": 6070
      },
      "size": {
        "widthMm": 1200,
        "depthMm": 600
      },
      "rotationDeg": 180,
      "color": "#e2cfb4"
    },
    {
      "id": "obj_template-041",
      "type": "chair",
      "name": "椅子",
      "position": {
        "x": 9500,
        "y": 5480
      },
      "size": {
        "widthMm": 450,
        "depthMm": 480
      },
      "rotationDeg": 0,
      "color": "#cfc6b8"
    },
    {
      "id": "obj_template-042",
      "type": "baycushion",
      "name": "飘窗垫",
      "position": {
        "x": 10770,
        "y": 4997
      },
      "size": {
        "widthMm": 520,
        "depthMm": 1575
      },
      "rotationDeg": 0,
      "color": "#e7dccd"
    },
    {
      "id": "obj_template-043",
      "type": "roundtable",
      "name": "茶桌",
      "position": {
        "x": 11180,
        "y": 8200
      },
      "size": {
        "widthMm": 600,
        "depthMm": 600
      },
      "rotationDeg": 0,
      "color": "#e2cfb4"
    },
    {
      "id": "obj_template-044",
      "type": "armchair",
      "name": "休闲椅",
      "position": {
        "x": 11180,
        "y": 7520
      },
      "size": {
        "widthMm": 750,
        "depthMm": 750
      },
      "rotationDeg": 0,
      "color": "#d6b99a"
    },
    {
      "id": "obj_template-045",
      "type": "armchair",
      "name": "休闲椅",
      "position": {
        "x": 11180,
        "y": 8880
      },
      "size": {
        "widthMm": 750,
        "depthMm": 750
      },
      "rotationDeg": 180,
      "color": "#d6b99a"
    },
    {
      "id": "obj_template-046",
      "type": "plant",
      "name": "绿植",
      "position": {
        "x": 11550,
        "y": 10250
      },
      "size": {
        "widthMm": 500,
        "depthMm": 500
      },
      "rotationDeg": 0,
      "color": "#a9c39b"
    }
  ],
  "measurements": []
}; if(typeof module!=="undefined") module.exports=project; else root.FloorPlanReference=project;})(globalThis);

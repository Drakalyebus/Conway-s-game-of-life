export const rules = {
    "types": [0, 1],
    "background": 0,
    "variables": {},
    "kernels": {
        "moore": [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1]
        ]
    },
    "default": {
        "kernel": "moore",
        "boundary": "wrap"
    },
    "behavior": [
        {
            "priority": 0,
            "order": [0],
            "from": [0],
            "condition": {
                "value": [1],
                "sign": "=",
                "count": [3],
                "kernel": "moore",
                "boundary": "wrap"
            },
            "elseTo": 0,
            "to": 1
        },
        {
            "priority": 0,
            "order": [0],
            "from": [1],
            "condition": {
                "or": [
                    {
                        "value": [1],
                        "sign": "<",
                        "count": [2],
                        "kernel": "moore",
                        "boundary": "wrap"
                    },
                    {
                        "value": [1],
                        "sign": ">",
                        "count": [3],
                        "kernel": "moore",
                        "boundary": "wrap"
                    }
                ]
            },
            "elseTo": 1,
            "to": 0
        }
    ]
};
#!/usr/bin/env bash

set -e

echo "Rinomino le migration nell'ordine corretto..."

mv 2026_01_13_162759_create_users_table.php \
   2026_01_14_090000_create_users_table.php

mv 2026_01_13_163922_create_ingredients_table.php \
   2026_01_14_090100_create_ingredients_table.php

mv 2026_01_13_164141_create_favorite_sandwiches_table.php \
   2026_01_14_090200_create_favorite_sandwiches_table.php

mv 2026_01_13_164333_create_favorite_sandwich_ingredients_table.php \
   2026_01_14_090300_create_favorite_sandwich_ingredients_table.php

mv 2026_01_14_084539_create_working_days_table.php \
   2026_01_14_090400_create_working_days_table.php

mv 2026_01_14_165927_create_time_slots_table.php \
   2026_01_14_090500_create_time_slots_table.php

mv 2026_01_13_170058_create_orders_table.php \
   2026_01_14_090600_create_orders_table.php

mv 2026_01_13_170324_create_order_ingredients_table.php \
   2026_01_14_090700_create_order_ingredients_table.php

echo "✔ Migration rinominate correttamente"


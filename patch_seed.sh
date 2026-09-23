sed -i "s|if (localStorage.getItem('isSeeded')) {|if (localStorage.getItem('isSeeded') \&\& localStorage.getItem('ajps_users')) {|g" src/utils/seedData.ts

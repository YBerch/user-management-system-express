const mongoose = require('lib/mongoose');
mongoose.set('debug', true);

const open = () => {
  return new Promise((resolve) => mongoose.connection.on('open', resolve))
};

const dropDatabase = () => {
  const db = mongoose.connection;
  return db.dropDatabase()
};

const requireModels = () => {
  require('models/user');
  require('models/group');
  return Promise.all(Object.values(mongoose.models).map((item) => {
    item.ensureIndexes()
  }))
};

const createUsers = () => {
  const users = [
    {
      firstName: 'test',
      lastName: 'test',
      email: 'test@test.com',
      password: 'supervasya',
      phone: '0000000000',
      permission: 'administrator',
      dateOfBirth: new Date('1990-05-08'),
      address: 'Ukraine, Kyiv, Khreschatyk 1/2'
    },
    {
      firstName: 'Vasja',
      lastName: 'Pupkin',
      email: 'vasja@email.com',
      password: 'supervasya',
      phone: '09556363662',
      permission: 'user',
      dateOfBirth: new Date('1990-05-08'),
      address: 'Ukraine, Kyiv, Khreschatyk 1/2'
    },
    {
      firstName: 'Petja',
      lastName: 'Pupkin',
      email: 'petja@email.com',
      password: '123',
      phone: '09556363473',
      permission: 'user',
      dateOfBirth: new Date('2001-12-08'),
      address: 'Ukraine, Lviv, Horodotska 1/2'
    },
    {
      firstName: 'Admin',
      lastName: 'Adminion',
      email: 'admin@gmail.com',
      password: '12345678',
      phone: '0938997178',
      permission: 'administrator',
      dateOfBirth: new Date('1988-01-10'),
      address: 'Ukraine, IF, Halytska 130/101'
    },
    {
      firstName: 'XZ',
      lastName: 'ZX',
      email: 'xz@email.com',
      password: 'admin',
      phone: '09556363775',
      permission: 'user',
      dateOfBirth: new Date('1900-12-08'),
      address: 'USA, New-York, Brodway str. 1024/40'
    },
    {
      firstName: 'Moderator',
      lastName: 'Moderatorion',
      email: 'moderator@gmail.com',
      password: 'moderator',
      phone: '09556363778',
      permission: 'moderator',
      dateOfBirth: new Date('1900-12-08'),
      address: 'USA, New-York, Brodway str. 1024/40'
    }
  ];
  const groups = [
    {name: 'group1'},
    {name: 'group2'},
    {name: 'group3'},
    {name: 'group4'}
  ];
  return Promise.all(
      users.map((item) => {
    const user = new mongoose.models.User(item);
    return user.save()
  })
    .concat(groups.map((item) => {
      const user = new mongoose.models.Group(item);
      return user.save()
    })),
    )
};

const close = () => {
  return mongoose.disconnect();
};

open()
  .then(dropDatabase)
  .then(requireModels)
  .then(createUsers)
  .then((res) => {
    console.log(res);
    close()
  })
.catch(err => {
  console.log(err);
  close()
});
const { getTeamCollection } = require('../db');

async function getAllTeamMembers(req, res) {
  try {
    const collection = await getTeamCollection();
    const members = await collection
      .find({}, { projection: { _id: 0 } })
      .toArray();
    res.json(members);
  } catch (error) {
    console.error('Unable to load team data:', error);
    res.status(500).json({ message: 'Unable to load team data' });
  }
}

async function getTeamMemberBySlug(req, res) {
  try {
    const { slug } = req.params;
    const collection = await getTeamCollection();
    const member = await collection.findOne(
      { slug },
      { projection: { _id: 0 } }
    );

    if (!member) {
      return res.status(404).json({ message: 'Team member not found' });
    }

    res.json(member);
  } catch (error) {
    console.error('Unable to load team data:', error);
    res.status(500).json({ message: 'Unable to load team data' });
  }
}

module.exports = {
  getAllTeamMembers,
  getTeamMemberBySlug,
};

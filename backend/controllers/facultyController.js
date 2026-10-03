const { getFacultyCollection, getTeamCollection } = require('../db');

async function getAllFaculty(req, res) {
  try {
    const collection = await getFacultyCollection();
    const faculty = await collection.find({}).sort({ name: 1 }).toArray();
    res.json(faculty);
  } catch (error) {
    console.error('Unable to load faculty data:', error);
    res.status(500).json({ message: 'Unable to load faculty data' });
  }
}

async function getFacultyBySlug(req, res) {
  try {
    const { slug } = req.params;
    const collection = await getFacultyCollection();
    let member = await collection.findOne({ slug });

    if (!member) {
      const teamCollection = await getTeamCollection();
      member = await teamCollection.findOne({ slug });
      if (member) {
        return res.json({ ...member, isFaculty: false });
      }
      return res.status(404).json({ message: 'Faculty coordinator not found' });
    }

    res.json(member);
  } catch (error) {
    console.error('Unable to load faculty data:', error);
    res.status(500).json({ message: 'Unable to load faculty data' });
  }
}

module.exports = {
  getAllFaculty,
  getFacultyBySlug,
};

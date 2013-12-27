
import os.path
import sqlite3
import ujson
import operator

__author__ = 'kyedidi'


class IndexDatabaseManager:
  """ Manages the database. Will create the database if it does not exist. """
  def __init__(self, database_path):
    self.database_path = database_path
    database_exists = os.path.isfile(database_path)
    self.conn = sqlite3.connect(database_path)
    self.rows_written = 0
    self.new_rows_written = 0
    self.already_exist = 0
    if not database_exists:
      self.create_db()
    # At this point, the schema should be set-up

  def __del__(self):
    # Commit at the end because it's way faster that way
    self.conn.commit()
    pass

  def query(self, query):
    c = self.conn.cursor()
    # print "query: ", query
    try:
      c.execute(query)
    except:
      print "Bad query: ", query
      exit(1)
    # return c.fetchall()
    while True:
      rows = c.fetchmany()
      if not rows:
        break
      for row in rows:
          yield row

  def get_entry(self, word):
    # Assumes entry already exists
    query = "SELECT * FROM reddit_index WHERE word = '%s';" % word
    existing_submissions = list(self.query(query))
    if len(existing_submissions) != 1:
      print "WHAAAAAT?: ", existing_submissions, " | len = ", len(existing_submissions)
      print "Query: ", query
      exit(1)
    # assert(len(existing_submissions) == 1)
    existing_submission = existing_submissions[0]
    return existing_submission

  def replace_submission(self, word, submission_ids):
    """ This is a seprate function because this is dangerous"""
    c = self.conn.cursor()
    c.execute("INSERT OR REPLACE INTO reddit_index VALUES ("
              "?, ?)",
              (word, submission_ids))
    # self.conn.commit()
    self.rows_written += 1

  def insert_word(self, word, submission_id, score):
    # Insert word along with the submission id it is found in
    # Insert a row of data
    submission_ids = []
    if self.row_exists(word):
      submission_ids = ujson.loads(self.get_entry(word)[1])  # we use [1] because that's the value
      submission_ids = [(x[0], x[1]) for x in submission_ids]
    submission_ids.append((submission_id, score))
    submission_ids = list(set(submission_ids))
    submission_ids.sort(key=operator.itemgetter(1), reverse=True)
    #print "about to serialize: ", submission_ids
    submission_ids = ujson.dumps(submission_ids)
    #print "about to write: ", submission_ids
    self.new_rows_written += 1
    self.replace_submission(word, submission_ids)

  def row_exists(self, word):
    assert(isinstance(word, basestring))
    c = self.conn.cursor()
    c.execute("SELECT * FROM reddit_index where word = ?", (word,))
    return c.fetchone() is not None

  def create_db(self):
    c = self.conn.cursor()
    c.execute("""
    CREATE TABLE "reddit_index" (
      "word" text NOT NULL,
      "submission_ids" text NOT NULL,
      PRIMARY KEY("word")
    );
    """)
    self.conn.commit()
    # print "Created DB."

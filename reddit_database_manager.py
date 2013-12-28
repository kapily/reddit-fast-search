
import os.path
import sqlite3
#from reddit_submission import Submission
#from secret import REDDIT_USER_AGENT
#from reddit_submission import Submission


__author__ = 'kyedidi'


class DatabaseManager:
  """ Manages the database. Will create the database if it does not exist. """
  def __init__(self, database_path):
    self.database_path = database_path
    database_exists = os.path.isfile(database_path)
    self.conn = sqlite3.connect(database_path)
    self.rows_written = 0
    self.new_rows_written = 0
    self.already_exist = 0
    self.cursor = self.conn.cursor()
    if not database_exists:
      self.create_db()

    # At this point, the schema should be set-up

  def __del__(self):
    # Commit at the end because it's way faster that way
    self.conn.commit()
    pass

  def query(self, query):
    c = self.conn.cursor()
    c.execute(query)
    # return c.fetchall()
    while True:
      rows = c.fetchmany()
      if not rows:
        break
      for row in rows:
          yield row

  def replace_submission(self, submission):
    """ This is a seprate function because this is dangerous"""
    #c = self.conn.cursor()
    # print submission.to_tuple()
    self.cursor.execute("INSERT OR REPLACE INTO submissions VALUES ("
              "?, ?, ?, ?, ?, ?, ?, ?)",
              submission.to_tuple())
    self.conn.commit()
    self.rows_written += 1
    # print "Added a new entry."

  def insert_submission(self, submission):
    # Insert a row of data
    if self.row_exists(submission.id):
      print "Submission with id =", submission.id, "already exists."
      print "Something is wrong in the code. This message should not print."
      return
    self.new_rows_written += 1
    self.replace_submission(submission)

  def row_exists(self, row_id):
    assert(isinstance(row_id, int))
    #c = self.conn.cursor()
    self.already_exist += 1
    # print "checking for row_id = ", row_id
    self.cursor.execute("SELECT * FROM submissions where id = ?", (row_id,))
    return c.fetchone() is not None

  def newest_from_subreddit(self, subreddit):
    # Returns the newest post id from the given subreddit
    pass

  # Future fields to add:
  # self post or not
  # number of comments
  def create_db(self):
    #c = self.conn.cursor()
    self.cursor.execute("""
    CREATE TABLE "submissions" (
      "id" integer NOT NULL,
      "disabled" integer NOT NULL,
      "title" text,
      "score" integer,
      "adult_content" integer,
      "created" integer,
      "subreddit" text,
      "permalink" text,
      PRIMARY KEY("id")
    );
    """)
    self.conn.commit()
    # print "Created DB."

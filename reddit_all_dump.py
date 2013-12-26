"""
Can use request_json to plug holes:
https://praw.readthedocs.org/en/latest/pages/code_overview.html

"""

import praw
from reddit_submission import Submission
from reddit_database_manager import DatabaseManager
from base36 import base36decode
# from secret import REDDIT_USER_AGENT
from base36 import base36encode
import sys

REDDIT_USER_AGENT = ""
# 100 is the max entries before pagination
ENTRIES_TO_FETCH = 100

class AllFetcher:
  def __init__(self, db_manager):
    print "Starting AllFetcher with user_agent =", REDDIT_USER_AGENT
    self.r = praw.Reddit(user_agent=REDDIT_USER_AGENT)
    self.db_manager = db_manager

  def get_most_recent_id(self):
    url = "http://www.reddit.com/new"
    submissions = self.r.request_json(url, params=None, data=None, as_objects=True, retry_on_error=True)
    submissions = submissions['data']['children']
    submission = submissions[0]
    return base36decode(submission.id)

  def __update_given_submission(self, submission):
    submission_id = base36decode(submission.id)

    if not self.db_manager.row_exists(submission_id):
      s = Submission.from_reddit_api(submission)
      self.db_manager.insert_submission(s)
    else:
      new_submission = Submission.from_reddit_api(submission)
      query = 'SELECT * FROM submissions WHERE id = %d;' % submission_id
      existing_submissions = [Submission(x) for x in self.db_manager.query(query)]
      assert(len(existing_submissions) == 1)
      existing_submission = existing_submissions[0]

      if existing_submission.score != new_submission.score:
        existing_submission.score = new_submission.score
        self.db_manager.replace_submission(existing_submission)


  def update_all_reddits(self, smallest_id, largest_id):
    # http://www.reddit.com/dev/api
    # t3_ means link
    # example:
    # http://www.reddit.com/by_id/t3_zcd40t3_zcd41,t3_zcd42,t3_zcd43/.json
    print "Attempting to download all reddit submissions between id: ", smallest_id, " and ", largest_id
    i = 0
    entries_written = 0
    entries_non_existent = 0
    while smallest_id < largest_id:
      i += 1
      # Debug printing every 50 runs (after processing 5000 entries) ~ every 100 seconds:
      if (i - 1) % 50 == 0:
        #if self.db_manager.new_rows_written % 1000 == 0 and self.db_manager.new_rows_written != 0:
        print "Entries written: ", entries_written, " [Non-existent: ", entries_non_existent, "] - on id: ", smallest_id


      url = "http://www.reddit.com/by_id/"

      submissions_to_fetch_int = set()


      # Queue up 100 submissions to fetch which the database does not currently contain
      while smallest_id < largest_id and len(submissions_to_fetch_int) < ENTRIES_TO_FETCH:
        # print "row_id = ", most_recent_id
        if not self.db_manager.row_exists(smallest_id):
          submissions_to_fetch_int.add(smallest_id)
        smallest_id += 1

      # Create a URL string for the query
      submissions_to_fetch_str = []
      for s in submissions_to_fetch_int:
        submissions_to_fetch_str.append("t3_" + base36encode(s))
      url += ','.join(submissions_to_fetch_str)

      # Query for the submissions
      submissions = None
      try:
        submissions = self.r.request_json(url, params={'limit': 100}, data=None, as_objects=True, retry_on_error=True)
        # print submissions
        submissions = submissions['data']['children']
      except:
        print "Error when trying to fetch url: ", url

      submissions_fetched_int = set()
      if submissions:
        for submission in submissions:
          self.__update_given_submission(submission)
          entries_written += 1
          submission_id = base36decode(submission.id)
          submissions_fetched_int.add(submission_id)



      # subtract submissions_fetched_int from submissions_to_fetch_int

      submissions_not_fetched = submissions_to_fetch_int.difference(submissions_fetched_int)
      for submission_id in submissions_not_fetched:
        # Mark nonexistent entries
        if not self.db_manager.row_exists(submission_id):
          non_existent_entry = Submission.non_existent_submission(submission_id)
          self.db_manager.insert_submission(non_existent_entry)
          entries_non_existent += 1


  """
  def update_posts(self):
    most_recent_id = self.get_most_recent_id()
    self.update_all_reddits(most_recent_id)
  """

def remove_commas(s):
  return ''.join(x for x in s if x not in ',')

def main():
  global REDDIT_USER_AGENT

  assert(len(sys.argv) == 4)

  REDDIT_USER_AGENT = sys.argv[1]
  smallest_id = int(remove_commas(sys.argv[2]))
  largest_id = int(remove_commas(sys.argv[3]))
  # DATABASE_PATH = sys.argv[4]

  # each bucket has 1,000,000 entries
  MILLION_BUCKET_SIZE = 1000000

  number_of_buckets = (largest_id - smallest_id) / MILLION_BUCKET_SIZE
  for i in range(number_of_buckets):
    current_smallest_id = smallest_id + (i * MILLION_BUCKET_SIZE)
    current_largest_id = current_smallest_id + MILLION_BUCKET_SIZE
    database_path = "all_submissions_dump_%dm_%dm.sqlite" % (current_smallest_id / MILLION_BUCKET_SIZE, current_largest_id / MILLION_BUCKET_SIZE)
    print "current_smallest_id: ", current_smallest_id
    print "current_largest_id: ", current_largest_id
    print "DATABASE_PATH: ", database_path
    # TODO: process here
    db_manager = DatabaseManager(database_path)
    f = AllFetcher(db_manager)
    f.update_all_reddits(current_smallest_id, current_largest_id)
    print "Added", db_manager.new_rows_written, "new entries total."
    print "Modified", db_manager.rows_written, " total entries ."
    print "Found", db_manager.already_exist, "that already exist."
    print "Closing DB."


if __name__ == "__main__":
  main()
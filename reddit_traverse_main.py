"""Use this for simple scripts which require DB queries."""

__author__ = 'kyedidi'

from reddit_submission import Submission
from reddit_database_manager import DatabaseManager
from reddit_index_db_manager import IndexDatabaseManager

# basically lowercase everything, remove brackets and punctuation (except apostrophes)

def is_valid_word(s):
  invalid_words = ['-']
  return s not in invalid_words

def clean_string(s):
  s = s.lower()
  return ''.join(x for x in s if x not in ',)([]?."\';')

def main():
  """
  query = 'SELECT * FROM submissions WHERE manually_marked = 0 and ' \
          'manually_verified = 0 and gender IS NOT NULL and age IS NOT NULL and ' \
          'height_in IS NOT NULL and current_weight_lbs IS NOT NULL;'
  """
  submissions_database_path = "reddit_submissions.sqlite"
  query = 'SELECT * FROM submissions;'
  submissions_db_manager = DatabaseManager(submissions_database_path)
  submissions = submissions_db_manager.query(query)

  reddit_index_database_path = "reddit_index.sqlite"
  index_db_manager = IndexDatabaseManager(reddit_index_database_path)
  # index_db = submissions_db_manager.query(query)

  index_db_manager
  processed = 0
  for submission in submissions:
    processed += 1
    submission = Submission(submission)
    # print submission.id
    # submission.media_json = None
    # submission.media_embed_json = None
    #Imgur.load_imgur_information_for_submission(submission)

    # for now, apostrophes are ok
    words = clean_string(submission.title).split()
    words = [x for x in words if is_valid_word(x)]
    for word in words:
      index_db_manager.insert_word(word, submission.id, submission.score)
    # TODO: add each word to the index now
    if processed % 1000 == 0:
      print "Processed: ", processed
      # exit(0)

if __name__ == "__main__":
  main()
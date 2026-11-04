from app.services.extraction import extract_baseline, validate


def test_extract_commitment():
    e = extract_baseline("I'll send Brian the database notes tonight.")
    assert e is not None
    assert e.type == "commitment"
    assert "send" in e.action.lower() or "notes" in e.action.lower()
    assert e.person == "Brian"
    assert e.deadline == "tonight"
    assert validate(e)


def test_rejects_short():
    assert extract_baseline("hi") is None

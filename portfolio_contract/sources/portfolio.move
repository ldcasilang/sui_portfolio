module portfolio::portfolio {

    use std::string;
    use std::vector;
    use sui::tx_context::{TxContext};
    use sui::object::{Self, UID};

    /// Portfolio object stored fully on-chain
    struct Portfolio has key {
        id: UID,

        name: string::String,
        course: string::String,
        school: string::String,
        about: string::String,
        skills: vector<string::String>,

        linkedin_url: string::String,
        github_url: string::String,

        /// ✅ Persist latest transaction digest ON-CHAIN
        last_tx_digest: vector<u8>,
    }

    /// Create portfolio (publish once)
    public entry fun create(
        name: string::String,
        course: string::String,
        school: string::String,
        about: string::String,
        skills: vector<string::String>,
        linkedin_url: string::String,
        github_url: string::String,
        ctx: &mut TxContext
    ) {
        let portfolio = Portfolio {
            id: object::new(ctx),
            name,
            course,
            school,
            about,
            skills,
            linkedin_url,
            github_url,
            last_tx_digest: tx_context::digest(ctx),
        };

        transfer::share_object(portfolio);
    }

    /// Update portfolio (ADMIN / OWNER)
    public entry fun update(
        portfolio: &mut Portfolio,
        name: string::String,
        course: string::String,
        school: string::String,
        about: string::String,
        skills: vector<string::String>,
        linkedin_url: string::String,
        github_url: string::String,
        ctx: &mut TxContext
    ) {
        portfolio.name = name;
        portfolio.course = course;
        portfolio.school = school;
        portfolio.about = about;
        portfolio.skills = skills;
        portfolio.linkedin_url = linkedin_url;
        portfolio.github_url = github_url;

        /// 🔥 Automatically updated every transaction
        portfolio.last_tx_digest = tx_context::digest(ctx);
    }
}
